import { NextResponse } from "next/server";
import { ApiError, toApiError } from "@/lib/api/errors";

export function apiSuccess<T>(data: T, status = 200, message = "Operação realizada com sucesso.") {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function apiFailure(error: unknown, context = "api") {
  const normalized = toApiError(error);
  if (normalized.status >= 500) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[${context}]`, JSON.stringify(details, null, 2));
  }
  return NextResponse.json(
    {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      },
    },
    { status: normalized.status },
  );
}

export function throwNotFound(message = "Recurso não encontrado."): never {
  throw new ApiError(404, "NOT_FOUND", message);
}
