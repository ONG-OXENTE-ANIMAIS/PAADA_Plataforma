"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

export type SessionUser = {
  id: string;
  nome: string;
  email: string;
  login: string;
  tipo: "admin" | "operador";
};

export type SessionState = {
  user: SessionUser | null;
  loading: boolean;
};

/** Consulta a sessão atual (GET /api/auth/session). */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  useEffect(() => {
    let ativo = true;
    apiFetch<{ user: SessionUser | null }>("/api/auth/session")
      .then((d) => ativo && setState({ user: d.user ?? null, loading: false }))
      .catch(() => ativo && setState({ user: null, loading: false }));
    return () => {
      ativo = false;
    };
  }, []);

  return state;
}

/** Guarda de rota: redireciona para /admin/login se não houver sessão. */
export function useRequireSession(): SessionState {
  const state = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!state.loading && !state.user) router.replace("/admin/login");
  }, [state.loading, state.user, router]);

  return state;
}
