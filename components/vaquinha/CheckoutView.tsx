"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { BRL, VALORES, pctOf, trunc, type Campaign, type Freq } from "@/lib/campaigns";
import { carregarSdkEfi, gerarPaymentTokenEfi } from "@/lib/payments/efi-client";
import CardPaymentSection, {
  detectarBandeira,
  formatarCpf,
  formatarNumeroCartao,
  formatarTelefone,
  formatarValidade,
  validarCpf,
} from "./CardPaymentSection";

/**
 * Flag de ativação do método de Cartão (Crédito e Débito).
 * Mude para true quando for ativar a modalidade de cartão em produção.
 */
export const CARTAO_HABILITADO = false;

export {
  detectarBandeira,
  formatarNumeroCartao,
  formatarValidade,
  formatarCpf,
  formatarTelefone,
  validarCpf,
};

type MetodoPagamento = "pix" | "cartao";

type PagandoPix = {
  tipo: "pix";
  qrCode: string;
  qrcodeBase64: string;
  copiaCola: string;
  expiraEm: string;
};

type RespostaDoacao = {
  donation: { id: string; status: string; valor: number };
  checkout_url: string;
  metodo?: MetodoPagamento;
  pagando?: PagandoPix;
  cartao?: {
    id: string;
    status: "approved" | "pending" | "rejected";
    parcelas: number;
    ultimos_digitos?: string;
    bandeira?: string;
  };
};

export function formatarMoeda(v: number): string {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calcularParcelamento(
  valorBase: number,
  numParcelas: number,
  funcao: "credito" | "debito" = "credito",
) {
  if (funcao === "debito" || numParcelas <= 1) {
    return {
      parcelas: 1,
      valorParcela: valorBase,
      total: valorBase,
      taxa: 0,
    };
  }
  const p = Math.min(Math.max(numParcelas, 1), 6);
  const valorCentavos = Math.round(valorBase * 100);
  const parcelaCentavos = Math.ceil(valorCentavos / p);
  const valorParcela = parcelaCentavos / 100;
  const total = (parcelaCentavos * p) / 100;
  const taxa = Math.max(0, Math.round((total - valorBase) * 100) / 100);
  return {
    parcelas: p,
    valorParcela,
    total,
    taxa,
  };
}

export default function CheckoutView({
  campaign,
  valorInicial = 50,
  freqInicial = "unica",
  metodoInicial = "pix",
}: {
  campaign: Campaign;
  valorInicial?: number;
  freqInicial?: Freq;
  metodoInicial?: MetodoPagamento;
}) {
  const aceitaMensal = !!campaign.recurring;
  const [freq, setFreq] = useState<Freq>(aceitaMensal ? freqInicial : "unica");
  const valorPadrao = valorInicial >= 1 ? valorInicial : 50;
  const ehValorSugerido = VALORES[freq].includes(valorPadrao);
  const [valor, setValor] = useState<number>(valorPadrao);
  const [modoOutro, setModoOutro] = useState<boolean>(!ehValorSugerido);
  const [customVal, setCustomVal] = useState<string>(
    ehValorSugerido ? "" : String(valorPadrao),
  );
  const [metodo, setMetodo] = useState<MetodoPagamento>(metodoInicial);

  // Dados do doador
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [anonimo, setAnonimo] = useState(false);

  // Dados do cartão
  const [funcaoCartao, setFuncaoCartao] = useState<"credito" | "debito">("credito");
  const [numCartao, setNumCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");
  const [telefoneTitular, setTelefoneTitular] = useState("");
  const [cep, setCep] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [focoCvv, setFocoCvv] = useState(false);

  // Estados de transação
  const [etapa, setEtapa] = useState<"form" | "processando" | "pix" | "sucesso">("form");
  const [erro, setErro] = useState<string | null>(null);
  const [pagandoPix, setPagandoPix] = useState<PagandoPix | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [doacaoConfirmadaId, setDoacaoConfirmadaId] = useState<string | null>(null);
  const [doacaoIdAtual, setDoacaoIdAtual] = useState<string | null>(null);
  const [simulando, setSimulando] = useState(false);
  const enviando = useRef(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculoParcelamento = calcularParcelamento(valor, parcelas, funcaoCartao);

  useEffect(() => () => pararPoll(), []);

  // Pré-carrega o script de segurança da Efí quando o usuário clica na aba de cartão
  useEffect(() => {
    if (metodo === "cartao") {
      carregarSdkEfi();
    }
  }, [metodo]);

  function pararPoll() {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }

  function iniciarPoll(doacaoId: string) {
    pararPoll();
    async function verificar() {
      try {
        const res = await fetch(`/api/doacoes/${doacaoId}?token=${doacaoId}`);
        const json = await res.json();
        const statusAtual = json?.data?.status ?? json?.donation?.status ?? json?.status;
        if (statusAtual === "PAGA") {
          pararPoll();
          setDoacaoConfirmadaId(doacaoId);
          setEtapa("sucesso");
        }
      } catch {
        /* continua aguardando */
      }
    }
    verificar();
    poll.current = setInterval(verificar, 4000);
  }

  async function copiarPix() {
    if (!pagandoPix?.copiaCola) return;
    try {
      await navigator.clipboard.writeText(pagandoPix.copiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione o código abaixo.");
    }
  }

  async function finalizarPagamento(e: React.FormEvent) {
    e.preventDefault();
    if (enviando.current) return;

    if (!valor || valor < 1) {
      setErro("O valor mínimo para doação é de R$ 1,00.");
      return;
    }

    if (!anonimo && nome.trim() && nome.trim().length < 2) {
      setErro("O seu nome deve ter pelo menos 2 caracteres ou marque a opção de doação anônima.");
      return;
    }

    if (!anonimo && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido ou marque a opção de doação anônima.");
      return;
    }

    const metodoEfetivo: MetodoPagamento = !CARTAO_HABILITADO && metodo === "cartao" ? "pix" : metodo;
    if (metodoEfetivo === "pix" && metodo === "cartao") {
      setMetodo("pix");
    }

    if (CARTAO_HABILITADO && metodoEfetivo === "cartao") {
      const digitosCartao = numCartao.replace(/\D/g, "");
      if (digitosCartao.length < 13 || digitosCartao.length > 16) {
        setErro("Informe um número de cartão válido.");
        return;
      }
      if (nomeTitular.trim().length < 3) {
        setErro("Informe o nome impresso no cartão.");
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(validade)) {
        setErro("Informe a validade do cartão no formato MM/AA.");
        return;
      }
      if (cvv.replace(/\D/g, "").length < 3) {
        setErro("Informe o código de segurança (CVV) do cartão.");
        return;
      }
      if (!validarCpf(cpfTitular)) {
        setErro("Informe um CPF válido para o titular do cartão.");
        return;
      }
    }

    enviando.current = true;
    setErro(null);
    setEtapa("processando");

    try {
      const digitosCartao = numCartao.replace(/\D/g, "");
      const bandeira = detectarBandeira(digitosCartao);

      // Tokenização Segura Client-Side (PCI-DSS):
      // Gera o payment_token diretamente no navegador com a Efí antes de chamar o nosso servidor
      let paymentToken: string | undefined = undefined;
      if (CARTAO_HABILITADO && metodoEfetivo === "cartao") {
        try {
          const [mesVal, anoVal] = validade.split("/");
          paymentToken = await gerarPaymentTokenEfi({
            numero: digitosCartao,
            cvv: cvv.replace(/\D/g, ""),
            mes: mesVal,
            ano: anoVal,
            bandeira: bandeira.toLowerCase(),
          });
        } catch (tokenErr: unknown) {
          const mensagemErro =
            tokenErr instanceof Error
              ? tokenErr.message
              : "Não foi possível validar o cartão com a operadora.";
          setErro(mensagemErro);
          setEtapa("form");
          enviando.current = false;
          return;
        }
      }

      const nomeLimpo = (!anonimo && (nome.trim() || (CARTAO_HABILITADO && metodoEfetivo === "cartao" ? nomeTitular.trim() : ""))) || undefined;
      const emailLimpo = (!anonimo && email.trim()) || undefined;
      const mensagemLimpa = mensagem.trim() || undefined;

      const corpoRequisicao: Record<string, unknown> = {
        campanha_id: String(campaign.id),
        valor,
        mensal: freq === "mes",
        anonimo,
        mensagem: mensagemLimpa,
        metodo_pagamento: metodoEfetivo,
        ...(anonimo
          ? {}
          : {
              ...(nomeLimpo ? { nome: nomeLimpo } : {}),
              ...(emailLimpo ? { email: emailLimpo } : {}),
            }),
      };

      if (CARTAO_HABILITADO && metodoEfetivo === "cartao") {
        corpoRequisicao.cartao = {
          payment_token: paymentToken,
          funcao: funcaoCartao,
          parcelas: funcaoCartao === "debito" ? 1 : parcelas,
          titular_nome: nomeTitular.trim(),
          titular_cpf: cpfTitular.replace(/\D/g, ""),
          titular_telefone: telefoneTitular.replace(/\D/g, "") || undefined,
          cep: cep.replace(/\D/g, "") || undefined,
          bandeira,
          ultimos_digitos: digitosCartao.slice(-4),
        };
      }

      const resposta = await apiFetch<RespostaDoacao>("/api/doacoes", {
        method: "POST",
        body: JSON.stringify(corpoRequisicao),
      });

      enviando.current = false;

      if (metodoEfetivo === "cartao") {
        setDoacaoConfirmadaId(resposta.donation.id);
        setEtapa("sucesso");
        return;
      }

      if (resposta.pagando) {
        setPagandoPix(resposta.pagando);
        setDoacaoIdAtual(resposta.donation.id);
        setEtapa("pix");
        iniciarPoll(resposta.donation.id);
      } else {
        window.location.assign(resposta.checkout_url);
      }
    } catch (err) {
      enviando.current = false;
      setEtapa("form");
      setErro(err instanceof Error ? err.message : "Não foi possível processar o pagamento.");
    }
  }

  const pct = pctOf(campaign);
  const bandeiraAtual = detectarBandeira(numCartao);
  const qrSrc = pagandoPix?.qrcodeBase64
    ? pagandoPix.qrcodeBase64.startsWith("data:image")
      ? pagandoPix.qrcodeBase64
      : `data:image/png;base64,${pagandoPix.qrcodeBase64}`
    : "";

  return (
    <section className="screen active" style={{ paddingBottom: "88px" }}>
      <div className="v-hero" style={{ paddingBottom: "36px" }}>
        <div className="wrap">
          <Link href={`/vaquinha/${campaign.slug}`} className="v-voltar">
            <i className="ph ph-arrow-left"></i> Voltar para a campanha
          </Link>
          
          <h1 style={{ fontSize: "clamp(1.85rem, 3.4vw, 2.75rem)", marginTop: "12px" }}>
            Apoiar: {campaign.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
            <span className="chip-mp" style={{ marginBottom: 0 }}>
              <i className="ph-fill ph-shield-check"></i> Checkout Seguro Efí Bank
            </span>
            <span style={{ fontSize: "13px", color: "var(--m70)", fontWeight: 600 }}>
              <i className="ph-fill ph-lock-key" style={{ color: "var(--laranja)" }}></i> Ambiente criptografado (TLS / mTLS)
            </span>
          </div>
        </div>
      </div>

      <div className="wrap form-grid" style={{ marginTop: "36px" }}>
        {/* COLUNA PRINCIPAL */}
        <div className="form-card">
          {etapa === "processando" && (
            <div className="mcentro" style={{ padding: "56px 20px" }}>
              <i className="ph ph-circle-notch spin"></i>
              <h3>
                {metodo === "pix" ? "Gerando QR Code Pix na Efí…" : "Processando pagamento no cartão…"}
              </h3>
              <p>
                Valor seguro de <b>{formatarMoeda(metodo === "pix" ? valor : calculoParcelamento.total)}{freq === "mes" ? " / mês" : ""}</b>
              </p>
            </div>
          )}

          {etapa === "pix" && pagandoPix && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <span className="chip-mp">
                <i className="ph-fill ph-pix-logo"></i> Pix gerado com sucesso
              </span>
              <h2 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.65rem", marginBottom: "8px" }}>
                Escaneie o QR Code ou use o Copia e Cola
              </h2>
              <p style={{ color: "var(--m70)", fontSize: "14.5px", maxWidth: "46ch", margin: "0 auto 20px" }}>
                Abra o aplicativo do seu banco, escolha <b>Pagar com Pix</b> e aponte a câmera ou cole o código abaixo.
              </p>

              <div
                style={{
                  background: "#fff",
                  border: "2px solid var(--m15)",
                  borderRadius: "22px",
                  padding: "18px",
                  width: "fit-content",
                  margin: "0 auto 20px",
                  boxShadow: "var(--sombra)",
                }}
              >
                <img
                  src={qrSrc}
                  alt="QR Code Pix Efí"
                  style={{ width: "240px", height: "240px", display: "block" }}
                />
              </div>

              <div className="campo" style={{ maxWidth: "480px", margin: "0 auto 16px", textAlign: "left" }}>
                <label htmlFor="checkout-copia-cola">Código Pix (Copia e Cola)</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    id="checkout-copia-cola"
                    type="text"
                    readOnly
                    value={pagandoPix.copiaCola}
                    style={{ flex: 1, fontFamily: "monospace", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    className="btn btn-laranja"
                    onClick={copiarPix}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <i className={copiado ? "ph-fill ph-check-circle" : "ph ph-copy"}></i>{" "}
                    {copiado ? "Código copiado!" : "Copiar código"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  borderRadius: "999px",
                  background: "var(--areia)",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "var(--marrom)",
                  marginTop: "8px",
                }}
              >
                <i className="ph ph-hourglass-medium" style={{ color: "var(--laranja)", fontSize: "18px" }}></i>
                Aguardando confirmação automática do banco…
              </div>

              {doacaoIdAtual && (
                <div style={{ marginTop: "18px" }}>
                  <button
                    type="button"
                    disabled={simulando}
                    onClick={async () => {
                      setSimulando(true);
                      try {
                        const res = await fetch(`/api/doacoes/${doacaoIdAtual}/simular`, { method: "POST" });
                        if (res.ok) {
                          pararPoll();
                          setDoacaoConfirmadaId(doacaoIdAtual);
                          setEtapa("sucesso");
                        } else {
                          alert("Não foi possível simular a confirmação.");
                        }
                      } catch {
                        alert("Erro de conexão ao simular confirmação.");
                      } finally {
                        setSimulando(false);
                      }
                    }}
                    style={{
                      background: "#e8f5e9",
                      border: "1.5px dashed #2e7d32",
                      color: "#1b5e20",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {simulando ? "Confirmando..." : "🧪 [Teste] Simular Pagamento Pix Confirmado"}
                  </button>
                  <p style={{ fontSize: "11px", color: "var(--m70)", marginTop: "4px" }}>
                    Em homologação ou localhost, apps de bancos reais não conseguem pagar QR Codes de teste. Use este botão para testar a confirmação.
                  </p>
                </div>
              )}

              <div style={{ marginTop: "26px" }}>
                <button
                  type="button"
                  className="btn btn-fantasma"
                  onClick={() => {
                    pararPoll();
                    setEtapa("form");
                  }}
                >
                  <i className="ph ph-arrow-left"></i> Alterar valor ou forma de pagamento
                </button>
              </div>
            </div>
          )}

          {etapa === "sucesso" && (
            <div className="form-ok">
              <i className="ph-fill ph-check-circle"></i>
              <h3>Doação confirmada! Muito obrigado!</h3>
              <p>
                Sua contribuição de <b>{BRL(valor)}</b> via{" "}
                <b>
                  {metodo === "pix"
                    ? "Pix à vista"
                    : funcaoCartao === "debito"
                      ? "Cartão de Débito (à vista)"
                      : `Cartão de Crédito (${parcelas}x)`}
                </b>{" "}
                foi registrada com sucesso para <b>{campaign.title}</b>.
              </p>
              {doacaoConfirmadaId && (
                <p style={{ fontSize: "12.5px", opacity: 0.75, marginBottom: "20px" }}>
                  Protocolo da doação: <code>{doacaoConfirmadaId}</code>
                </p>
              )}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={`/vaquinha/${campaign.slug}`} className="btn btn-laranja">
                  <i className="ph ph-arrow-left"></i> Voltar para a campanha
                </Link>
                <button
                  type="button"
                  className="btn btn-fantasma"
                  onClick={() => {
                    setEtapa("form");
                    setPagandoPix(null);
                  }}
                >
                  Fazer nova doação
                </button>
              </div>
            </div>
          )}

          {etapa === "form" && (
            <form onSubmit={finalizarPagamento}>
              {/* 1. VALOR E FREQUÊNCIA */}
              <div style={{ marginBottom: "28px" }}>
                <h3 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.25rem", marginBottom: "14px" }}>
                  1. Escolha o valor da sua doação
                </h3>

                {aceitaMensal && (
                  <div className="freq" role="group" aria-label="Frequência da doação" style={{ maxWidth: "340px" }}>
                    <button
                      type="button"
                      className={freq === "unica" ? "on" : ""}
                      onClick={() => setFreq("unica")}
                    >
                      Doação única
                    </button>
                    <button
                      type="button"
                      className={freq === "mes" ? "on" : ""}
                      onClick={() => setFreq("mes")}
                    >
                      Todo mês
                    </button>
                  </div>
                )}

                <div className="amts" style={{ marginBottom: modoOutro ? "14px" : 0 }}>
                  {VALORES[freq].map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={!modoOutro && valor === v ? "on" : ""}
                      onClick={() => {
                        setModoOutro(false);
                        setValor(v);
                        setCustomVal("");
                      }}
                    >
                      R$ {v}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={modoOutro ? "on" : ""}
                    onClick={() => {
                      setModoOutro(true);
                      if (!customVal) {
                        setCustomVal(String(valor));
                      }
                    }}
                  >
                    Outro
                  </button>
                </div>

                {modoOutro && (
                  <div className="campo" style={{ marginBottom: 0 }}>
                    <label htmlFor="chk-outro-valor">
                      Escolha outro valor <span className="contador">mínimo R$ 1,00</span>
                    </label>
                    <div className="campo-valor" style={{ marginBottom: 0 }}>
                      <span>R$</span>
                      <input
                        id="chk-outro-valor"
                        type="number"
                        min={1}
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Digite o valor (mínimo R$ 1,00)"
                        value={customVal}
                        style={{ paddingLeft: "52px" }}
                        onChange={(e) => {
                          setCustomVal(e.target.value);
                          const n = parseFloat(e.target.value.replace(",", "."));
                          if (!Number.isNaN(n) && n >= 1) setValor(n);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. DADOS DO DOADOR */}
              <div style={{ marginBottom: "28px", paddingTop: "22px", borderTop: "1px solid var(--m15)" }}>
                <h3 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.25rem", marginBottom: "14px" }}>
                  2. Seus dados
                </h3>

                <label
                  htmlFor="chk-anonimo"
                  style={{
                    display: "inline-flex",
                    gap: "9px",
                    alignItems: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "16px",
                    cursor: "pointer",
                    background: "var(--areia)",
                    padding: "9px 15px",
                    borderRadius: "999px",
                  }}
                >
                  <input
                    id="chk-anonimo"
                    type="checkbox"
                    checked={anonimo}
                    onChange={(e) => {
                      setAnonimo(e.target.checked);
                      if (e.target.checked) {
                        setNome("");
                        setEmail("");
                      }
                    }}
                  />
                  Quero doar anonimamente no mural
                </label>

                <div className="duo">
                  <div className="campo">
                    <label htmlFor="chk-nome">
                      Seu nome <span className="contador">{anonimo ? "anônimo" : "opcional"}</span>
                    </label>
                    <input
                      id="chk-nome"
                      type="text"
                      placeholder={anonimo ? "Doação Anônima" : "Como quer aparecer?"}
                      disabled={anonimo}
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="chk-email">
                      E-mail <span className="contador">para recibo</span>
                    </label>
                    <input
                      id="chk-email"
                      type="email"
                      placeholder="voce@exemplo.com.br"
                      disabled={anonimo}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="campo" style={{ marginTop: "6px", marginBottom: 0 }}>
                  <label htmlFor="chk-mensagem">
                    Mensagem de apoio <span className="contador">{mensagem.length}/280 • opcional</span>
                  </label>
                  <textarea
                    id="chk-mensagem"
                    rows={3}
                    maxLength={280}
                    placeholder="Deixe uma mensagem de carinho para apoiar esta causa!"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. FORMA DE PAGAMENTO (PIX OU CARTÃO) */}
              <div style={{ marginBottom: "24px", paddingTop: "22px", borderTop: "1px solid var(--m15)" }}>
                <h3 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.25rem", marginBottom: "14px" }}>
                  3. Forma de pagamento
                </h3>

                <div
                  className="mpay"
                  style={{ gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "22px" }}
                  role="tablist"
                  aria-label="Escolha o método de pagamento"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={metodo === "pix"}
                    className={metodo === "pix" ? "on" : ""}
                    onClick={() => {
                      setMetodo("pix");
                      setErro(null);
                    }}
                    style={{ padding: "18px 14px", fontSize: "14px" }}
                  >
                    <i className="ph-fill ph-pix-logo" style={{ fontSize: "26px" }}></i>
                    <span>Pix Instantâneo</span>
                    <small style={{ fontSize: "11px", opacity: 0.75, fontWeight: 500 }}>
                      QR Code ou Copia e Cola • Sem taxas
                    </small>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={metodo === "cartao"}
                    className={metodo === "cartao" ? "on" : ""}
                    onClick={() => {
                      setMetodo("cartao");
                      setErro(null);
                    }}
                    style={{
                      padding: "18px 14px",
                      fontSize: "14px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {!CARTAO_HABILITADO && (
                      <span
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "var(--laranja)",
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: "99px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Em breve
                      </span>
                    )}
                    <i className="ph-fill ph-credit-card" style={{ fontSize: "26px" }}></i>
                    <span>Cartão</span>
                    <small style={{ fontSize: "11px", opacity: 0.75, fontWeight: 500 }}>
                      {!CARTAO_HABILITADO ? "Crédito e Débito • Em breve" : "Crédito (até 6x) ou Débito (à vista)"}
                    </small>
                  </button>
                </div>

                {/* ABA PIX */}
                {metodo === "pix" && (
                  <div
                    style={{
                      background: "var(--areia)",
                      borderRadius: "18px",
                      padding: "20px 22px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <i
                        className="ph-fill ph-pix-logo"
                        style={{ fontSize: "32px", color: "var(--laranja)", flexShrink: 0 }}
                      ></i>
                      <div>
                        <b style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "15.5px", display: "block" }}>
                          Liberação imediata via Banco Central
                        </b>
                        <span style={{ fontSize: "13.5px", color: "var(--m70)" }}>
                          Ao clicar no botão abaixo, geraremos um QR Code exclusivo e o código Pix Copia e Cola para você pagar em qualquer banco.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA CARTÃO (CRÉDITO OU DÉBITO) */}
                {metodo === "cartao" &&
                  (CARTAO_HABILITADO ? (
                    <CardPaymentSection
                      valor={valor}
                      funcaoCartao={funcaoCartao}
                      setFuncaoCartao={setFuncaoCartao}
                      numCartao={numCartao}
                      setNumCartao={setNumCartao}
                      nomeTitular={nomeTitular}
                      setNomeTitular={setNomeTitular}
                      validade={validade}
                      setValidade={setValidade}
                      cvv={cvv}
                      setCvv={setCvv}
                      cpfTitular={cpfTitular}
                      setCpfTitular={setCpfTitular}
                      telefoneTitular={telefoneTitular}
                      setTelefoneTitular={setTelefoneTitular}
                      cep={cep}
                      setCep={setCep}
                      parcelas={parcelas}
                      setParcelas={setParcelas}
                    />
                  ) : (
                    <div
                      style={{
                        background: "var(--areia)",
                        borderRadius: "18px",
                        padding: "28px 22px",
                        textAlign: "center",
                        display: "grid",
                        gap: "14px",
                        border: "1.5px dashed var(--m15)",
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "rgba(252, 104, 26, 0.12)",
                          color: "var(--laranja)",
                          display: "grid",
                          placeItems: "center",
                          margin: "0 auto",
                          fontSize: "28px",
                        }}
                      >
                        <i className="ph-fill ph-credit-card"></i>
                      </div>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            background: "var(--laranja)",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "99px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: "8px",
                          }}
                        >
                          Em breve
                        </span>
                        <h4 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.2rem", margin: "0 0 6px" }}>
                          Pagamento com Cartão em homologação
                        </h4>
                        <p style={{ color: "var(--m70)", fontSize: "14px", maxWidth: "44ch", margin: "0 auto" }}>
                          A modalidade de cartão de crédito e débito estará disponível muito em breve. Por enquanto, utilize o <b>Pix Instantâneo</b> para apoiar com liberação imediata e sem taxas!
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-laranja"
                          onClick={() => {
                            setMetodo("pix");
                            setErro(null);
                          }}
                          style={{ fontSize: "14.5px", padding: "12px 24px" }}
                        >
                          <i className="ph-fill ph-pix-logo"></i> Doar com Pix Instantâneo
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {erro && (
                <p
                  role="alert"
                  style={{
                    color: "#b3261e",
                    background: "rgba(179, 38, 30, 0.08)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    fontSize: "13.5px",
                    marginBottom: "16px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="ph-fill ph-warning-circle" style={{ fontSize: "18px" }}></i> {erro}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-laranja"
                style={{ width: "100%", fontSize: "16.5px", padding: "17px" }}
              >
                <i className={metodo === "pix" || !CARTAO_HABILITADO ? "ph-fill ph-pix-logo" : "ph-fill ph-credit-card"}></i>{" "}
                {metodo === "pix" || !CARTAO_HABILITADO ? (
                  `Gerar Pix de ${formatarMoeda(valor)}${freq === "mes" ? " / mês" : ""}`
                ) : funcaoCartao === "debito" ? (
                  `Pagar ${formatarMoeda(valor)} no Débito (à vista)`
                ) : (
                  <>
                    Pagar {formatarMoeda(calculoParcelamento.total)} no Crédito{" "}
                    <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                      ({parcelas}x de {formatarMoeda(calculoParcelamento.valorParcela)})
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* COLUNA LATERAL: RESUMO DA CAMPANHA E DO PAGAMENTO */}
        <aside className="v-doar" aria-label="Resumo da doação">
          {campaign.img || campaign.full ? (
            <img
              src={campaign.img || campaign.full || ""}
              alt={campaign.title}
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                objectFit: "cover",
                borderRadius: "16px",
                marginBottom: "16px",
              }}
            />
          ) : null}

          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--laranja)", textTransform: "uppercase" }}>
            {campaign.cat || "Campanha Solidária"}
          </span>
          <h3 style={{ fontFamily: '"Bricolage Grotesque"', fontSize: "1.3rem", margin: "4px 0 12px" }}>
            {trunc(campaign.title, 60)}
          </h3>

          <div className="barra" style={{ height: "8px", marginBottom: "8px" }}>
            <i style={{ width: `${pct}%` }}></i>
          </div>
          <p style={{ fontSize: "13px", color: "var(--m70)", marginBottom: "20px" }}>
            <b>{BRL(campaign.raised)}</b> arrecadados de {BRL(campaign.goal)} ({pct}%)
          </p>

          <div className="msum" style={{ marginBottom: "18px" }}>
            <div className="msum-row">
              <span>Sua contribuição</span>
              <b>{formatarMoeda(valor)}</b>
            </div>
            <div className="msum-row">
              <span>Frequência</span>
              <b>{freq === "unica" ? "Doação única" : "Mensal"}</b>
            </div>
            <div className="msum-row">
              <span>Método</span>
              <b>
                {metodo === "pix" ? (
                  "Pix à vista"
                ) : !CARTAO_HABILITADO ? (
                  <span style={{ color: "var(--laranja)" }}>Cartão (Em breve)</span>
                ) : funcaoCartao === "debito" ? (
                  "Cartão de débito (à vista)"
                ) : (
                  <>
                    Cartão de crédito{" "}
                    <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                      ({parcelas}x de {formatarMoeda(calculoParcelamento.valorParcela)})
                    </span>
                  </>
                )}
              </b>
            </div>
            <div className="msum-row">
              <span>Taxa para você</span>
              <b style={{ color: CARTAO_HABILITADO && metodo === "cartao" && calculoParcelamento.taxa > 0 ? "var(--laranja)" : "#2e7d32" }}>
                {CARTAO_HABILITADO && metodo === "cartao" && calculoParcelamento.taxa > 0
                  ? `+ ${formatarMoeda(calculoParcelamento.taxa)}`
                  : "R$ 0,00"}
              </b>
            </div>
            <div className="msum-row" style={{ fontSize: "15.5px" }}>
              <span>Total a pagar</span>
              <b style={{ color: "var(--laranja)", fontSize: "17px" }}>
                {formatarMoeda(metodo === "pix" || !CARTAO_HABILITADO ? valor : calculoParcelamento.total)}
              </b>
            </div>
          </div>

          <div className="segura">
            <div className="linha1">
              <i className="ph-fill ph-shield-check"></i> Pagamento 100% protegido
            </div>
            <p className="mfine" style={{ marginTop: "6px" }}>
              Transação processada diretamente pelo Banco Efí. Seus dados financeiros são criptografados de ponta a ponta.
            </p>
            <div className="formas" style={{ marginTop: "12px" }}>
              <i className="ph-fill ph-pix-logo" title="Pix"></i>
              <i className="ph-fill ph-credit-card" title="Cartão de Crédito"></i>
              <i className="ph-fill ph-lock-key" title="Conexão Segura"></i>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
