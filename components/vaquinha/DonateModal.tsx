"use client";

import { useEffect, useRef, useState } from "react";
import { BRL, trunc, type Campaign, type Freq } from "@/lib/campaigns";
import { useToast } from "@/components/fx/ToastProvider";

type Passo = "mPay" | "mProc" | "mDone";
type Forma = "Pix" | "Cartão" | "Boleto";

export default function DonateModal({
  open,
  campaign,
  valor,
  freq,
  onClose,
  onConfirm,
}: {
  open: boolean;
  campaign: Campaign;
  valor: number;
  freq: Freq;
  onClose: () => void;
  onConfirm: (valor: number) => void;
}) {
  const toast = useToast();
  const [passo, setPasso] = useState<Passo>("mPay");
  const [forma, setForma] = useState<Forma>("Pix");
  const [done, setDone] = useState({ valor: 0, camp: "" });
  const pagando = useRef(false);

  /* ao abrir, volta sempre pro primeiro passo */
  useEffect(() => {
    if (open) {
      setPasso("mPay");
      pagando.current = false;
    }
  }, [open]);

  /* Esc fecha */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  function confirmar() {
    if (pagando.current) return;
    pagando.current = true;
    setPasso("mProc");
    setTimeout(() => {
      setDone({ valor, camp: trunc(campaign.title, 28) });
      setPasso("mDone");
      onConfirm(valor);
      pagando.current = false;
    }, 1800);
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
          <div className="mpay" id="mMethods">
            <button
              className={forma === "Pix" ? "on" : ""}
              onClick={() => setForma("Pix")}
            >
              <i className="ph-fill ph-pix-logo"></i>Pix
            </button>
            <button
              className={forma === "Cartão" ? "on" : ""}
              onClick={() => setForma("Cartão")}
            >
              <i className="ph ph-credit-card"></i>Cartão
            </button>
            <button
              className={forma === "Boleto" ? "on" : ""}
              onClick={() => setForma("Boleto")}
            >
              <i className="ph ph-barcode"></i>Boleto
            </button>
          </div>
          <button
            className="btn btn-laranja"
            id="mConfirm"
            style={{ fontSize: "16px", padding: "16px" }}
            onClick={confirmar}
          >
            <i className="ph ph-lock-key"></i> Pagar com Mercado Pago
          </button>
          <p className="mfine">
            Você sairia para o ambiente seguro do Mercado Pago — simulado neste
            protótipo.
          </p>
        </div>

        <div
          id="mProc"
          className={"mcentro" + (passo !== "mProc" ? " hidden" : "")}
        >
          <i className="ph ph-circle-notch spin"></i>
          <h3>Conectando ao Mercado Pago…</h3>
          <p>
            Gerando cobrança de{" "}
            <b id="mProcVal">
              {BRL(valor) + (freq === "mes" ? " / mês" : "") + " · " + forma}
            </b>
          </p>
        </div>

        <div
          id="mDone"
          className={"mcentro" + (passo !== "mDone" ? " hidden" : "")}
        >
          <svg className="ck" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="#FC681A"
              strokeWidth="3"
            />
            <path
              fill="none"
              stroke="#301607"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.5 27l8 8 15.5-16"
            />
          </svg>
          <h3>Doação confirmada!</h3>
          <p>
            <b id="mDoneVal">{BRL(done.valor)}</b> já estão a caminho de{" "}
            <b id="mDoneCamp">{done.camp}</b>.
            <br />
            Obrigado por ajeitar o mundo com a gente.
          </p>
          <div className="mdone-bts">
            <button
              className="btn btn-fantasma"
              id="btnReceipt"
              style={{ padding: "12px 10px", fontSize: "13.5px" }}
              onClick={() =>
                toast("Comprovante enviado para o seu e-mail.", "seal-check")
              }
            >
              Ver comprovante
            </button>
            <button
              className="btn btn-laranja"
              id="btnDoneClose"
              style={{ padding: "12px 10px", fontSize: "13.5px" }}
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
