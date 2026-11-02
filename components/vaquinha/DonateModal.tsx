"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { BRL, trunc, type Campaign, type Freq } from "@/lib/campaigns";
import {
  detectarBandeira,
  formatarCpf,
  formatarNumeroCartao,
  formatarValidade,
  validarCpf,
} from "@/components/vaquinha/CheckoutView";

type PagandoPix = {
  tipo: "pix";
  qrCode: string;        // EMVCO (linha digitavel / copia e cola)
  qrcodeBase64: string;  // imagem PNG do QR code
  copiaCola: string;
  expiraEm: string;
};

type RespostaDoacao = {
  donation: { id: string; status: string };
  checkout_url: string;
  metodo?: "pix" | "cartao";
  pagando?: PagandoPix;
};

type Passo = "mPay" | "mPix" | "mProc" | "mOk";

export default function DonateModal({
  open,
  campaign,
  valor,
  freq,
  onClose,
}: {
  open: boolean;
  campaign: Campaign;
  valor: number;
  freq: Freq;
  onClose: () => void;
}) {
  const [passo, setPasso] = useState<Passo>("mPay");
  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [anonimo, setAnonimo] = useState(false);

  // Campos de Cartão no Modal
  const [numCartao, setNumCartao] = useState("");
  const [nomeTitular, setNomeTitular] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpfTitular, setCpfTitular] = useState("");
  const [parcelas, setParcelas] = useState(1);

  const [erro, setErro] = useState<string | null>(null);
  const [pagando, setPagando] = useState<PagandoPix | null>(null);
  const [copiado, setCopiado] = useState(false);
  const enviando = useRef(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Esc fecha */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
      pararPoll();
    };
  }, [open, onClose]);

  useEffect(() => () => pararPoll(), []);

  function pararPoll() {
    if (poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }

  async function confirmar() {
    if (enviando.current) return;

    if (!anonimo && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido ou marque a doação anônima.");
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
        setErro("Informe a validade (MM/AA).");
        return;
      }
      if (cvv.replace(/\D/g, "").length < 3) {
        setErro("Informe o CVV do cartão.");
        return;
      }
      if (!validarCpf(cpfTitular)) {
        setErro("Informe um CPF válido do titular.");
        return;
      }
    }

    enviando.current = true;
    setPasso("mProc");
    setErro(null);
    try {
      const digitosCartao = numCartao.replace(/\D/g, "");
      const corpo: Record<string, unknown> = {
        campanha_id: campaign.id,
        valor,
        mensal: freq === "mes",
        anonimo,
        metodo_pagamento: metodo,
        ...(anonimo
          ? {}
          : {
              nome: (nome.trim() || (metodo === "cartao" ? nomeTitular.trim() : "")) || null,
              email: email.trim() || null,
            }),
      };

      if (metodo === "cartao") {
        corpo.cartao = {
          parcelas,
          titular_nome: nomeTitular.trim(),
          titular_cpf: cpfTitular.replace(/\D/g, ""),
          bandeira: detectarBandeira(digitosCartao),
          ultimos_digitos: digitosCartao.slice(-4),
        };
      }

      const resposta = await apiFetch<RespostaDoacao>("/api/doacoes", {
        method: "POST",
        body: JSON.stringify(corpo),
      });

      if (metodo === "cartao") {
        enviando.current = false;
        setPasso("mOk");
        setTimeout(() => onClose(), 2800);
        return;
      }

      setPagando(resposta.pagando ?? null);
      if (resposta.pagando) {
        /* Efi Pix: exibe QR code e confirma por polling em vez de redirecionar */
        setPasso("mPix");
        iniciarPoll(resposta.donation.id);
      } else {
        window.location.assign(resposta.checkout_url);
      }
    } catch (e) {
      enviando.current = false;
      setPasso("mPay");
      setErro(e instanceof Error ? e.message : "Não foi possível iniciar a doação.");
    }
  }

  async function iniciarPoll(doacaoId: string) {
    const token = doacaoId;
    async function verificar() {
      try {
        const res = await fetch(`/api/doacoes/${doacaoId}?token=${token}`);
        const json = await res.json();
        const statusAtual = json?.data?.status ?? json?.donation?.status ?? json?.status;
        if (statusAtual === "PAGA") {
          pararPoll();
          setPasso("mOk");
          setTimeout(() => onClose(), 2500);
        }
      } catch {
        /* segue tentando ate confirmar ou o usuario fechar */
      }
    }
    verificar();
    poll.current = setInterval(verificar, 5000);
  }

  async function copiarPix() {
    if (!pagando?.copiaCola) return;
    try {
      await navigator.clipboard.writeText(pagando.copiaCola);
      setCopiado(true);
      setErro(null);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      setErro("Não foi possível copiar o código Pix.");
    }
  }

  const oculto = (id: Passo) => (passo !== id ? " hidden" : "");
  const qrSrc = pagando?.qrcodeBase64
    ? pagando.qrcodeBase64.startsWith("data:image")
      ? pagando.qrcodeBase64
      : `data:image/png;base64,${pagando.qrcodeBase64}`
    : "";

  return (
    <div
      className={"mback" + (open ? " open" : "")}
      id="donateBack"
      aria-hidden={open ? "false" : "true"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar doação"
        style={{ width: "min(480px, 100%)", maxHeight: "92vh", overflowY: "auto" }}
      >
        <button className="mclose" id="mClose" aria-label="Fechar" onClick={onClose}>
          <i className="ph ph-x"></i>
        </button>

        <div id="mPay" className={oculto("mPay") ? "hidden" : undefined}>
          <span className="chip-mp">
            <i className={metodo === "pix" ? "ph-fill ph-pix-logo" : "ph-fill ph-credit-card"}></i>{" "}
            {metodo === "pix" ? "Efí Pix" : "Efí Cartão"}
          </span>
          <h3>Confirme sua doação</h3>
          <div className="msum">
            <div className="msum-row">
              <span>Vaquinha</span>
              <b id="mCamp">{trunc(campaign.title, 34)}</b>
            </div>
            <div className="msum-row">
              <span>Valor</span>
              <b id="mVal">
                {freq === "unica" ? BRL(valor) : BRL(valor) + " / mês"}
              </b>
            </div>
            <div className="msum-row">
              <span>Repetição</span>
              <b id="mFreq">{freq === "unica" ? "Doação única" : "Renova todo mês"}</b>
            </div>
          </div>

          {/* Seletor Pix vs Cartão */}
          <div
            className="mpay"
            style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "16px" }}
            role="tablist"
            aria-label="Forma de pagamento"
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
            >
              <i className="ph-fill ph-pix-logo"></i>
              <span>Pix</span>
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
            >
              <i className="ph-fill ph-credit-card"></i>
              <span>Cartão de Crédito</span>
            </button>
          </div>

          <div className="campo" style={{ margin: "12px 0" }}>
            <label htmlFor="dm-nome">
              Seu nome <span className="contador">opcional</span>
            </label>
            <input
              id="dm-nome"
              type="text"
              placeholder="Como quer aparecer?"
              disabled={anonimo}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="campo" style={{ marginBottom: "12px" }}>
            <label htmlFor="dm-email">
              E-mail <span className="contador">para o comprovante</span>
            </label>
            <input
              id="dm-email"
              type="email"
              placeholder="voce@exemplo.com.br"
              disabled={anonimo}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <label
            htmlFor="dm-anonimo"
            style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "14px", marginBottom: "14px", cursor: "pointer" }}
          >
            <input
              id="dm-anonimo"
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
            Quero doar como anônimo
          </label>

          {metodo === "cartao" && (
            <div
              style={{
                borderTop: "1px solid var(--m15)",
                paddingTop: "14px",
                marginTop: "6px",
                marginBottom: "14px",
              }}
            >
              <div className="campo" style={{ marginBottom: "10px" }}>
                <label htmlFor="dm-cc-num">
                  Número do Cartão <span className="contador">{detectarBandeira(numCartao)}</span>
                </label>
                <input
                  id="dm-cc-num"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={numCartao}
                  onChange={(e) => setNumCartao(formatarNumeroCartao(e.target.value))}
                />
              </div>
              <div className="campo" style={{ marginBottom: "10px" }}>
                <label htmlFor="dm-cc-nome">Nome impresso no cartão</label>
                <input
                  id="dm-cc-nome"
                  type="text"
                  placeholder="NOME COMO NO CARTÃO"
                  value={nomeTitular}
                  onChange={(e) => setNomeTitular(e.target.value.toUpperCase())}
                />
              </div>
              <div className="duo" style={{ gap: "10px", marginBottom: "10px" }}>
                <div className="campo" style={{ marginBottom: 0 }}>
                  <label htmlFor="dm-cc-val">Validade</label>
                  <input
                    id="dm-cc-val"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={validade}
                    onChange={(e) => setValidade(formatarValidade(e.target.value))}
                  />
                </div>
                <div className="campo" style={{ marginBottom: 0 }}>
                  <label htmlFor="dm-cc-cvv">CVV</label>
                  <input
                    id="dm-cc-cvv"
                    type="text"
                    inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
              <div className="duo" style={{ gap: "10px" }}>
                <div className="campo" style={{ marginBottom: 0 }}>
                  <label htmlFor="dm-cc-cpf">CPF do titular</label>
                  <input
                    id="dm-cc-cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpfTitular}
                    onChange={(e) => setCpfTitular(formatarCpf(e.target.value))}
                  />
                </div>
                <div className="campo" style={{ marginBottom: 0 }}>
                  <label htmlFor="dm-cc-parc">Parcelas</label>
                  <select
                    id="dm-cc-parc"
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12].map((p) => (
                      <option key={p} value={p}>
                        {p}x de {BRL(valor / p)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {erro && (
            <p role="alert" style={{ color: "#b3261e", fontSize: "13.5px", marginBottom: "12px", fontWeight: 600 }}>
              <i className="ph ph-warning"></i> {erro}
            </p>
          )}

          <button
            className="btn btn-laranja"
            id="mConfirm"
            style={{ fontSize: "16px", padding: "16px" }}
            onClick={confirmar}
            disabled={passo === "mProc"}
          >
            <i className="ph ph-lock-key"></i>{" "}
            {metodo === "pix" ? "Pagar via Pix (Efí)" : `Pagar no Cartão (${parcelas}x)`}
          </button>

          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <Link
              href={`/vaquinha/${campaign.slug}/pagamento?valor=${valor}&freq=${freq}&metodo=${metodo}`}
              onClick={onClose}
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: "var(--laranja)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <i className="ph ph-arrows-out-simple"></i> Abrir tela completa de pagamento
            </Link>
          </div>
        </div>

        <div id="mProc" className={"mcentro" + (passo !== "mProc" ? " hidden" : "")}>
          <i className="ph ph-circle-notch spin"></i>
          <h3>{metodo === "pix" ? "Gerando cobrança Pix…" : "Processando pagamento no cartão…"}</h3>
          <p>
            Valor seguro de{" "}
            <b id="mProcVal">{BRL(valor) + (freq === "mes" ? " / mês" : "")}</b>
          </p>
        </div>

        <div id="mPix" className={oculto("mPix") ? "hidden" : undefined}>
          {pagando && (
            <>
              <h3>Pague com Pix (Efi)</h3>
              <p className="mfine">
                Leia o QR code com qualquer app de banco ou carteira Pix, ou copie o
                código abaixo.
              </p>
              <div className="mpix" style={{ margin: "16px 0", textAlign: "center" }}>
                <img
                  src={qrSrc}
                  alt="QR code Pix"
                  style={{
                    width: "240px",
                    height: "240px",
                    background: "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    display: "block",
                    margin: "0 auto 12px",
                  }}
                />
              </div>
              <div className="campo" style={{ marginBottom: "10px" }}>
                <label>Código Pix (copia e cola)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="pix-copia-cola"
                    value={pagando.copiaCola}
                    readOnly
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-laranja"
                    onClick={copiarPix}
                    disabled={copiado}
                  >
                    <i className="ph ph-copy"></i> {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              <p className="mfine" style={{ fontSize: "12.5px", color: "#666", marginBottom: "6px" }}>
                Expira em {new Date(pagando.expiraEm).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}.{" "}
                <span>Confirmando pagamento…</span>
              </p>
            </>
          )}
        </div>

        <div id="mOk" className={oculto("mOk") ? "hidden" : undefined}>
          <i className="ph-fill ph-check-circle" style={{ color: "#2e7d32", fontSize: "32px", marginBottom: "10px" }}></i>
          <h3>Doação confirmada!</h3>
          <p className="mfine">Obrigado pela sua ajuda. A campanha já recebeu o valor.</p>
        </div>
      </div>
    </div>
  );
}
