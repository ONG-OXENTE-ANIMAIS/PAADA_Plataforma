import { ApiError } from "@/lib/api/errors";
import { readSession, type SessionUser } from "@/lib/auth/session";

export type Permission =
  | "campanhas:manage"
  | "doacoes:manage"
  | "parceiros:manage"
  | "contato:manage"
  | "usuarios:manage"
  | "dashboard:view";

const OPERADOR: Permission[] = [
  "campanhas:manage",
  "doacoes:manage",
  "parceiros:manage",
  "contato:manage",
  "dashboard:view",
];

export function hasPermission(user: SessionUser, permission: Permission) {
  return user.tipo === "admin" || OPERADOR.includes(permission);
}

export async function authorize(permission: Permission) {
  const user = await readSession();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "É necessário entrar no painel.");
  if (!hasPermission(user, permission)) throw new ApiError(403, "FORBIDDEN", "Você não tem permissão para esta operação.");
  return user;
}
