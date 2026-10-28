import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { TipoUsuario } from "@/types/database.types";

export const SESSION_COOKIE = "paada_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  login: string;
  tipo: TipoUsuario;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET deve ser configurado com ao menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ nome: user.nome, email: user.email, login: user.login, tipo: user.tipo })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.nome !== "string" || typeof payload.email !== "string" || typeof payload.login !== "string") return null;
    if (payload.tipo !== "admin" && payload.tipo !== "operador") return null;
    return { id: payload.sub, nome: payload.nome, email: payload.email, login: payload.login, tipo: payload.tipo };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const session = await readSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
