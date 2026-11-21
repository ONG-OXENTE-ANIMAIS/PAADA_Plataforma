"use client";

/** Wrapper de fetch para a API interna: desembrulha { success, data } e
 *  lança Error com a mensagem amigável devolvida pelo servidor. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  let payload: {
    success?: boolean;
    data?: T;
    message?: string;
    error?: { message?: string; details?: unknown };
  } | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || payload?.success === false) {
    let message =
      payload?.error?.message ??
      payload?.message ??
      `Não foi possível concluir a operação (erro ${response.status}).`;

    const details = payload?.error?.details as
      | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
      | undefined;
    if (details?.fieldErrors && Object.keys(details.fieldErrors).length > 0) {
      const fieldErrorsStr = Object.entries(details.fieldErrors)
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        .join("; ");
      message = `${message} (${fieldErrorsStr})`;
    }

    throw new Error(message);
  }
  return payload?.data as T;
}
