"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { BRL, VALORES, pctOf, trunc, type Campaign, type Freq } from "@/lib/campaigns";
import { carregarSdkEfi, gerarPaymentTokenEfi } from "@/lib/payments/efi-client";

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

export function detectarBandeira(num: string): string {
  const n = num.replace(/\D/g, "");
  if (!n) return "CARTÃO";
  if (/^4/.test(n)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "MASTERCARD";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(n)) return "ELO";
  if (/^3[47]/.test(n)) return "AMEX";
  if (/^(606282|3841)/.test(n)) return "HIPERCARD";
  return "CARTÃO";
}

export function formatarNumeroCartao(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatarValidade(v: string): string {
  const limpo = v.replace(/\D/g, "").slice(0, 4);
  if (limpo.length <= 2) return limpo;
  return `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
}

export function formatarCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatarTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function validarCpf(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

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

    if (!anonimo && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido ou marque a opção de doação anônima.");
      return;
    }

    if (metodo === "cartao") {
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
      if (metodo === "cartao") {
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

      const corpoRequisicao: Record<string, unknown> = {
        campanha_id: campaign.id,
        valor,
        mensal: freq === "mes",
        anonimo,
        mensagem: mensagem.trim() || null,
        metodo_pagamento: metodo,
        ...(anonimo
          ? {}
          : {
              nome: (nome.trim() || (metodo === "cartao" ? nomeTitular.trim() : "")) || null,
              email: email.trim() || null,
            }),
      };

      if (metodo === "cartao") {
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

      if (metodo === "cartao") {
        setDoacaoConfirmadaId(resposta.donation.id);
        setEtapa("sucesso");
        return;
      }

      if (resposta.pagando) {
        setPagandoPix(resposta.pagando);
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
                    style={{ padding: "18px 14px", fontSize: "14px" }}
                  >
                    <i className="ph-fill ph-credit-card" style={{ fontSize: "26px" }}></i>
                    <span>Cartão</span>
                    <small style={{ fontSize: "11px", opacity: 0.75, fontWeight: 500 }}>
                      Crédito (até 6x) ou Débito (à vista)
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
                {metodo === "cartao" && (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {/* Preview Interativo do Cartão com proporção ISO 1.586:1 */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        maxWidth: "340px",
                        aspectRatio: "1.586 / 1",
                        margin: "2px auto 4px",
                        background: "linear-gradient(135deg, #301607 0%, #52230a 58%, #FC681A 100%)",
                        color: "#FDE7CD",
                        borderRadius: "18px",
                        padding: "20px 22px",
                        boxShadow: "0 16px 34px -10px rgba(48, 22, 7, 0.35)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Círculo decorativo sutil no fundo do cartão */}
                      <div
                        style={{
                          position: "absolute",
                          right: "-36px",
                          top: "-36px",
                          width: "150px",
                          height: "150px",
                          borderRadius: "50%",
                          background: "rgba(253, 231, 205, 0.07)",
                          pointerEvents: "none",
                        }}
                      />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Chip metálico proporcional */}
                          <div
                            style={{
                              width: "40px",
                              height: "30px",
                              borderRadius: "6px",
                              background: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
                              border: "1px solid rgba(255,255,255,0.4)",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "24px",
                                height: "16px",
                                border: "1px solid rgba(48, 22, 7, 0.35)",
                                borderRadius: "3px",
                              }}
                            />
                          </div>
                          <i className="ph ph-contactless-payment" style={{ fontSize: "20px", opacity: 0.8 }}></i>
                        </div>
                        <b
                          style={{
                            fontFamily: '"Bricolage Grotesque"',
                            fontSize: "12px",
                            letterSpacing: "0.08em",
                            background: "rgba(253, 231, 205, 0.16)",
                            padding: "4px 11px",
                            borderRadius: "99px",
                          }}
                        >
                          {funcaoCartao === "debito" ? "DÉBITO" : "CRÉDITO"} • {bandeiraAtual}
                        </b>
                      </div>

                      {!focoCvv ? (
                        <>
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: "1.18rem",
                              letterSpacing: "0.13em",
                              fontWeight: 700,
                              zIndex: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {numCartao || "•••• •••• •••• ••••"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-end",
                              gap: "12px",
                              fontSize: "12px",
                              zIndex: 1,
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <small style={{ display: "block", fontSize: "9.5px", opacity: 0.7, textTransform: "uppercase" }}>
                                Titular do Cartão
                              </small>
                              <b
                                style={{
                                  display: "block",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {nomeTitular || "NOME IMPRESSO"}
                              </b>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <small style={{ display: "block", fontSize: "9.5px", opacity: 0.7, textTransform: "uppercase" }}>
                                Validade
                              </small>
                              <b style={{ fontFamily: "monospace" }}>{validade || "MM/AA"}</b>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ zIndex: 1 }}>
                          <div
                            style={{
                              background: "rgba(0,0,0,0.65)",
                              height: "32px",
                              margin: "0 -22px 12px",
                            }}
                          />
                          <div
                            style={{
                              background: "#fff",
                              color: "#301607",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              textAlign: "right",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "14px",
                            }}
                          >
                            CVV: {cvv || "•••"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Seletor compacto (booleano) Crédito vs Débito antes do número do cartão */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                      <div
                        className="freq"
                        role="group"
                        aria-label="Função do cartão"
                        style={{
                          width: "100%",
                          maxWidth: "320px",
                          marginBottom: 0,
                          padding: "4px",
                        }}
                      >
                        <button
                          type="button"
                          className={funcaoCartao === "credito" ? "on" : ""}
                          style={{ padding: "8px 14px", fontSize: "13.5px" }}
                          onClick={() => setFuncaoCartao("credito")}
                        >
                          Crédito
                        </button>
                        <button
                          type="button"
                          className={funcaoCartao === "debito" ? "on" : ""}
                          style={{ padding: "8px 14px", fontSize: "13.5px" }}
                          onClick={() => {
                            setFuncaoCartao("debito");
                            setParcelas(1);
                          }}
                        >
                          Débito (à vista)
                        </button>
                      </div>
                    </div>

                    <div className="campo" style={{ marginBottom: 0 }}>
                      <label htmlFor="cc-num">Número do Cartão</label>
                      <input
                        id="cc-num"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="0000 0000 0000 0000"
                        value={numCartao}
                        onChange={(e) => setNumCartao(formatarNumeroCartao(e.target.value))}
                      />
                    </div>

                    <div className="campo" style={{ marginBottom: 0 }}>
                      <label htmlFor="cc-nome">Nome impresso no cartão</label>
                      <input
                        id="cc-nome"
                        type="text"
                        autoComplete="cc-name"
                        placeholder="Como está escrito no cartão"
                        value={nomeTitular}
                        onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="duo">
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-val">Validade (MM/AA)</label>
                        <input
                          id="cc-val"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM/AA"
                          value={validade}
                          onChange={(e) => setValidade(formatarValidade(e.target.value))}
                        />
                      </div>
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-cvv">Código de Segurança (CVV)</label>
                        <input
                          id="cc-cvv"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          placeholder="123"
                          maxLength={4}
                          value={cvv}
                          onFocus={() => setFocoCvv(true)}
                          onBlur={() => setFocoCvv(false)}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        />
                      </div>
                    </div>

                    <div className="duo">
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-cpf">CPF do titular</label>
                        <input
                          id="cc-cpf"
                          type="text"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          value={cpfTitular}
                          onChange={(e) => setCpfTitular(formatarCpf(e.target.value))}
                        />
                      </div>
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-tel">
                          Celular do titular <span className="contador">opcional</span>
                        </label>
                        <input
                          id="cc-tel"
                          type="text"
                          inputMode="tel"
                          placeholder="(00) 00000-0000"
                          value={telefoneTitular}
                          onChange={(e) => setTelefoneTitular(formatarTelefone(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="duo">
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-cep">
                          CEP de cobrança <span className="contador">opcional</span>
                        </label>
                        <input
                          id="cc-cep"
                          type="text"
                          inputMode="numeric"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) =>
                            setCep(
                              e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 8)
                                .replace(/(\d{5})(\d)/, "$1-$2"),
                            )
                          }
                        />
                      </div>
                      <div className="campo" style={{ marginBottom: 0 }}>
                        <label htmlFor="cc-parcelas">
                          {funcaoCartao === "debito" ? "Pagamento no Débito" : "Opções de parcelamento"}
                        </label>
                        {funcaoCartao === "debito" ? (
                          <input
                            id="cc-parcelas"
                            type="text"
                            readOnly
                            value={`1x de ${formatarMoeda(valor)} (à vista)`}
                            style={{ fontWeight: 600, background: "var(--areia)", cursor: "default" }}
                          />
                        ) : (
                          <select
                            id="cc-parcelas"
                            value={parcelas}
                            onChange={(e) => setParcelas(Number(e.target.value))}
                          >
                            {[1, 2, 3, 4, 5, 6].map((p) => {
                              const calc = calcularParcelamento(valor, p, "credito");
                              return (
                                <option key={p} value={p}>
                                  {p}x de {formatarMoeda(calc.valorParcela)}{" "}
                                  {p === 1 ? "(à vista)" : calc.taxa > 0 ? `(taxa: +${formatarMoeda(calc.taxa)})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                <i className={metodo === "pix" ? "ph-fill ph-pix-logo" : "ph-fill ph-credit-card"}></i>{" "}
                {metodo === "pix" ? (
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
              <b style={{ color: metodo === "cartao" && calculoParcelamento.taxa > 0 ? "var(--laranja)" : "#2e7d32" }}>
                {metodo === "cartao" && calculoParcelamento.taxa > 0
                  ? `+ ${formatarMoeda(calculoParcelamento.taxa)}`
                  : "R$ 0,00"}
              </b>
            </div>
            <div className="msum-row" style={{ fontSize: "15.5px" }}>
              <span>Total a pagar</span>
              <b style={{ color: "var(--laranja)", fontSize: "17px" }}>
                {formatarMoeda(metodo === "pix" ? valor : calculoParcelamento.total)}
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
