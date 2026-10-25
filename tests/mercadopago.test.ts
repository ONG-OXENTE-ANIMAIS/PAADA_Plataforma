import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validarAssinaturaMercadoPago } from "@/lib/payments/mercadopago";

const materialHmac = "webhook-secret-test";

function assinar(dataId: string, requestId: string, ts: string, segredo = materialHmac) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", segredo).update(manifest).digest("hex");
}

describe("validarAssinaturaMercadoPago", () => {
  it("aceita assinatura v\u00e1lida (HMAC do manifest oficial)", () => {
    const dataId = "12345";
    const requestId = "req-abc";
    const ts = Math.floor(Date.now() / 1000).toString();
    const v1 = assinar(dataId, requestId, ts);
    expect(validarAssinaturaMercadoPago(`ts=${ts},v1=${v1}`, requestId, dataId, materialHmac)).toBe(true);
  });

  it("rejeita assinatura adulterada (id divergente do manifest)", () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const v1 = assinar("99999", "req-abc", ts);
    expect(validarAssinaturaMercadoPago(`ts=${ts},v1=${v1}`, "req-abc", "12345", materialHmac)).toBe(false);
  });

  it("rejeita timestamp fora da toler\u00e2ncia", () => {
    const ts = Math.floor(Date.now() / 1000 - 3600).toString();
    const v1 = assinar("12345", "req-abc", ts);
    expect(validarAssinaturaMercadoPago(`ts=${ts},v1=${v1}`, "req-abc", "12345", materialHmac)).toBe(false);
  });

  it("rejeita cabe\u00e7alhos ausentes", () => {
    expect(validarAssinaturaMercadoPago(null, "req", "123", materialHmac)).toBe(false);
    expect(validarAssinaturaMercadoPago("ts=1,v1=abc", null, "123", materialHmac)).toBe(false);
    expect(validarAssinaturaMercadoPago("ts=1,v1=abc", "req", null, materialHmac)).toBe(false);
  });

  it("rejeita assinatura com segredo errado", () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const v1 = assinar("12345", "req", ts, "outro-segredo");
    expect(validarAssinaturaMercadoPago(`ts=${ts},v1=${v1}`, "req", "12345", materialHmac)).toBe(false);
  });
});
