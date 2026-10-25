import { ApiError } from "@/lib/api/errors";

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "O corpo da requisição deve ser JSON.");
  }
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "O corpo JSON enviado é inválido.");
  }
}

export function parseId(value: string): string {
  const id = value.trim();
  if (!id || id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new ApiError(400, "INVALID_ID", "Identificador inválido.");
  }
  return id;
}

export function parsePagination(url: URL) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new ApiError(403, "INVALID_ORIGIN", "Origem da requisição não autorizada.");
}
