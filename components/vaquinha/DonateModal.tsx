"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { BRL, trunc, type Campaign, type Freq } from "@/lib/campaigns";

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
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [anonimo, setAnonimo] = useState(false);
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
        const data = await res.json();
        if (data.donation?.status === "PAGA") {
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

  return (
    <div
      className={"mback" + (open ? " open" : "")}
      id="donateBack"
      aria-hidden={open ? "false" : "true"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Confirmar doação">
        <button className="mclose" id="mClose" aria-label="Fechar" onClick={onClose}>
          <i className="ph ph-x"></i>
        </button>

        <div id="mPay" className={oculto("mPay") ? "hidden" : undefined}>
          <span className="chip-mp">
            <i className="ph-fill ph-pix-logo"></i> Efi Pix
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
            <i className="ph ph-lock-key"></i> Pagar via Pix (Efi)
          </button>
          <p className="mfine">
            Use qualquer app de banco ou carteira Pix para ler o QR code ou copiar o
            código Pix e concluir o pagamento.
          </p>
        </div>

        <div id="mProc" className={"mcentro" + (passo !== "mProc" ? " hidden" : "")}>
          <i className="ph ph-circle-notch spin"></i>
          <h3>Gerando cobrança Pix…</h3>
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
                  src={`data:image/png;base64,${pagando.qrcodeBase64}`}
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
