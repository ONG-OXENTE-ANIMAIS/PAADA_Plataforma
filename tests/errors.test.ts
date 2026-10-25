import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/lib/api/errors";
import { ZodError } from "zod";

describe("toApiError", () => {
  it("mantém ApiError", () => {
    const original = new ApiError(404, "NOT_FOUND", "Sumiu.");
    const err = toApiError(original);
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("converte ZodError em VALIDATION_ERROR 400", () => {
    try {
      expect(true).toBe(true);
      throw new ZodError([]);
    } catch (e) {
      const err = toApiError(e);
      expect(err.status).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
    }
  });

  it("converte violação de unicidade (23505) em 409", () => {
    const err = toApiError({ code: "23505", message: "duplicate key" });
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("converte chave estrangeira (23503) em 409", () => {
    const err = toApiError({ code: "23503", message: "fk violation" });
    expect(err.status).toBe(409);
    expect(err.code).toBe("REFERENCE_CONFLICT");
  });

  it("converte PGRST116 em 404", () => {
    const err = toApiError({ code: "PGRST116", message: "no rows" });
    expect(err.status).toBe(404);
  });

  it("erro desconhecido vira 500 genérico (sem vazar detalhes)", () => {
    const err = toApiError(new Error("senha do banco: abc123"));
    expect(err.status).toBe(500);
    expect(err.message).toBe("Não foi possível concluir a operação.");
    expect(err.message).not.toContain("abc123");
  });
});
