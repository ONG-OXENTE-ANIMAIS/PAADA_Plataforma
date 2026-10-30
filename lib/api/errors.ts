import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isPostgrestError(error: unknown): error is { code: string; message: string; details?: string } {
  return typeof error === "object" && error !== null && "code" in error && "message" in error;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError) {
    return new ApiError(400, "VALIDATION_ERROR", "Os dados enviados são inválidos.", error.flatten());
  }
  if (isPostgrestError(error)) {
    if (error.code === "23505") return new ApiError(409, "CONFLICT", "Já existe um registro com estes dados.");
    if (error.code === "23503") return new ApiError(409, "REFERENCE_CONFLICT", "O registro está vinculado a outros dados.");
    if (error.code === "23504") return new ApiError(409, "CONFLICT", "Os dados enviados violam uma restrição do banco de dados.");
    if (error.code === "PGRST116") return new ApiError(404, "NOT_FOUND", "Registro não encontrado.");
  }
  return new ApiError(500, "INTERNAL_ERROR", "Não foi possível concluir a operação.");
}
