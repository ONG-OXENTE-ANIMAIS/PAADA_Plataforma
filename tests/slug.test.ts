import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

describe("slugify", () => {
  it("remove acentos, espaços e caracteres especiais", () => {
    expect(slugify("Patas do Mercadão: castração!")).toBe("patas-do-mercadao-castracao");
  });

  it("normaliza maiúsculas e múltiplos separadores", () => {
    expect(slugify("  VAQUINHA   do  Abrigo -- 2025  ")).toBe("vaquinha-do-abrigo-2025");
  });

  it("limita o tamanho a 100 caracteres", () => {
    expect(slugify("a".repeat(300)).length).toBeLessThanOrEqual(100);
  });
});

describe("uniqueSlug", () => {
  it("acrescenta sufixo aleatório ao slug", () => {
    const sufixo = uniqueSlug("Vaquinha Teste");
    expect(sufixo.startsWith("vaquinha-teste-")).toBe(true);
    expect(sufixo.length).toBeGreaterThan("vaquinha-teste".length);
  });
});
