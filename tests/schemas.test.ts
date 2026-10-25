import { describe, expect, it } from "vitest";
import {
  campanhaCreateSchema,
  contatoCreateSchema,
  doacaoCreateSchema,
  imagemUploadSchema,
  loginSchema,
  usuarioCreateSchema,
} from "@/lib/validations/schemas";

describe("campanhaCreateSchema", () => {
  const base = { titulo: "Vaquinha do abrigo", valor_meta: 1000 };

  it("aceita payload válido", () => {
    const r = campanhaCreateSchema.parse({ ...base, data_inicio: "2025-01-01", data_termino: "2025-03-01" });
    expect(r.status).toBe("RASCUNHO");
    expect(r.visivel).toBe(false);
  });

  it("rejeita término anterior ao início", () => {
    expect(() =>
      campanhaCreateSchema.parse({ ...base, data_inicio: "2025-03-01", data_termino: "2025-01-01" }),
    ).toThrow();
  });

  it("rejeita valores monetários negativos", () => {
    expect(() => campanhaCreateSchema.parse({ ...base, valor_meta: -5 })).toThrow();
  });
});

describe("doacaoCreateSchema", () => {
  it("aceita doação identificada", () => {
    const r = doacaoCreateSchema.parse({ campanha_id: "CMP001", valor: 50, nome: "Maria", email: "maria@exemplo.com" });
    expect(r.anonimo).toBe(false);
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => doacaoCreateSchema.parse({ campanha_id: "CMP001", valor: 0 })).toThrow();
  });

  it("rejeita e-mail inválido", () => {
    expect(() => doacaoCreateSchema.parse({ campanha_id: "CMP001", valor: 10, email: "nope" })).toThrow();
  });
});

describe("contatoCreateSchema (honeypot)", () => {
  it("aceita mensagem legítima", () => {
    const r = contatoCreateSchema.parse({
      nome: "João",
      email: "joao@exemplo.com",
      assunto: "Parceria",
      mensagem: "Gostaria de ajudar com os mutirões de adoção.",
    });
    expect(r.tipo).toBe("CONTATO");
  });

  it("rejeita quando o campo-armadilha website é preenchido (bot)", () => {
    expect(() =>
      contatoCreateSchema.parse({
        nome: "Bot",
        email: "bot@spam.com",
        assunto: "Spam",
        mensagem: "Compre agora em http://spam.example",
        website: "http://spam.example",
      }),
    ).toThrow();
  });
});

describe("imagemUploadSchema", () => {
  it("aceita data URL de imagem", () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
    expect(imagemUploadSchema.parse({ arquivo: dataUrl, papel: "CAPA" }).arquivo).toBe(dataUrl);
  });

  it("rejeita quando nem url nem arquivo são enviados", () => {
    expect(() => imagemUploadSchema.parse({ papel: "CAPA" })).toThrow();
  });

  it("rejeita tipo de arquivo não suportado", () => {
    expect(() => imagemUploadSchema.parse({ arquivo: "data:application/pdf;base64,JVBERi0=" })).toThrow();
  });
});

describe("usuarioCreateSchema", () => {
  it("exige senha de ao menos 10 caracteres", () => {
    expect(() =>
      usuarioCreateSchema.parse({ nome: "Ana", email: "ana@oxente.org", login: "ana", senha: "curta123", tipo: "operador" }),
    ).toThrow();
    expect(() =>
      usuarioCreateSchema.parse({ nome: "Ana", email: "ana@oxente.org", login: "ana", senha: "senha-forte-2025", tipo: "operador" }),
    ).not.toThrow();
  });
});

describe("loginSchema", () => {
  it("aceita login e senha preenchidos", () => {
    expect(loginSchema.parse({ login: "ana", senha: "x".repeat(10) })).toBeTruthy();
  });
});
