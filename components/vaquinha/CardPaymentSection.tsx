"use client";

import { useState } from "react";
import { formatarMoeda, calcularParcelamento } from "./CheckoutView";

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

export type CardPaymentData = {
  funcaoCartao: "credito" | "debito";
  numCartao: string;
  nomeTitular: string;
  validade: string;
  cvv: string;
  cpfTitular: string;
  telefoneTitular: string;
  cep: string;
  parcelas: number;
};

export default function CardPaymentSection({
  valor,
  funcaoCartao,
  setFuncaoCartao,
  numCartao,
  setNumCartao,
  nomeTitular,
  setNomeTitular,
  validade,
  setValidade,
  cvv,
  setCvv,
  cpfTitular,
  setCpfTitular,
  telefoneTitular,
  setTelefoneTitular,
  cep,
  setCep,
  parcelas,
  setParcelas,
}: {
  valor: number;
  funcaoCartao: "credito" | "debito";
  setFuncaoCartao: (f: "credito" | "debito") => void;
  numCartao: string;
  setNumCartao: (v: string) => void;
  nomeTitular: string;
  setNomeTitular: (v: string) => void;
  validade: string;
  setValidade: (v: string) => void;
  cvv: string;
  setCvv: (v: string) => void;
  cpfTitular: string;
  setCpfTitular: (v: string) => void;
  telefoneTitular: string;
  setTelefoneTitular: (v: string) => void;
  cep: string;
  setCep: (v: string) => void;
  parcelas: number;
  setParcelas: (p: number) => void;
}) {
  const [focoCvv, setFocoCvv] = useState(false);
  const digitosCartao = numCartao.replace(/\D/g, "");
  const bandeiraAtual = detectarBandeira(digitosCartao);

  return (
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
  );
}
