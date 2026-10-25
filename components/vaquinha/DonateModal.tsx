"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { BRL, trunc, type Campaign, type Freq } from "@/lib/campaigns";

type RespostaDoacao = {
  donation: { id: string; status: string };
  checkout_url: string;
};

type Passo = "mPay" | "mProc";

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
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [anonimo, setAnonimo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviando = useRef(false);

  /* Esc fecha */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  async function confirmar() {
    if (enviando.current) return;

    if (!anonimo && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro("Informe um e-mail válido ou marque a doação anônima.");
      return;
    }

    enviando.current = true;
    setPasso("mProc");
    setErro(null);
    try {
      const resposta = await apiFetch<RespostaDoacao>("/api/doacoes", {
        method: "POST",
        body: JSON.stringify({
          campanha_id: campaign.id,
          valor,
          mensal: freq === "mes",
          anonimo,
          ...(anonimo ? {} : { nome: nome.trim() || null, email: email.trim() || null }),
        }),
      });
      /* vai para o ambiente seguro do Mercado Pago */
      window.location.assign(resposta.checkout_url);
    } catch (e) {
      enviando.current = false;
      setPasso("mPay");
      setErro(e instanceof Error ? e.message : "Não foi possível iniciar a doação.");
    }
  }

  const oculto = (id: Passo) => (passo !== id ? " hidden" : "");

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
      >
        <button className="mclose" id="mClose" aria-label="Fechar" onClick={onClose}>
          <i className="ph ph-x"></i>
        </button>

        <div id="mPay" className={oculto("mPay") ? "hidden" : undefined}>
          <span className="chip-mp">
            <i className="ph-fill ph-pix-logo"></i> Mercado Pago
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

          <div className="campo" style={{ margin: "14px 0" }}>
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
          <div className="campo" style={{ marginBottom: "14px" }}>
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
            style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "14px", marginBottom: "16px", cursor: "pointer" }}
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

          {erro && (
            <p
              role="alert"
              style={{
                color: "#b3261e",
                fontSize: "13.5px",
                marginBottom: "12px",
                fontWeight: 600,
              }}
            >
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
            <i className="ph ph-lock-key"></i> Pagar com Mercado Pago
          </button>
          <p className="mfine">
            Você será levado ao ambiente seguro do Mercado Pago para concluir o
            pagamento — Pix, cartão ou boleto.
          </p>
        </div>

        <div
          id="mProc"
          className={"mcentro" + (passo !== "mProc" ? " hidden" : "")}
        >
          <i className="ph ph-circle-notch spin"></i>
          <h3>Abrindo o Mercado Pago…</h3>
          <p>
            Gerando cobrança segura de{" "}
            <b id="mProcVal">
              {BRL(valor) + (freq === "mes" ? " / mês" : "")}
            </b>
          </p>
        </div>
      </div>
    </div>
  );
}
