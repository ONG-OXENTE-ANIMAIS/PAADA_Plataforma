"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/hooks/useSession";

const LINKS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/nova", label: "Nova vaquinha" },
  { href: "/admin/campanhas", label: "Campanhas" },
  { href: "/admin/doacoes", label: "Doações" },
  { href: "/admin/parceiros", label: "Parceiros" },
  { href: "/admin/contato", label: "Mensagens" },
  { href: "/admin/usuarios", label: "Usuários", adminOnly: true },
];

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export default function AdminBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();

  const sair = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* sessão já encerrada */
    }
    router.push("/");
    router.refresh();
  };

  return (
    <header className="adminbar">
      <div className="wrap">
        <Link href="/admin" className="logo">
          <svg className="sol">
            <use href="#sol" />
          </svg>
          oxente
        </Link>
        <span className="admin-tag">Painel da ONG</span>
        {user && (
          <nav className="admin-links" aria-label="Navegação do painel" style={{ display: "flex", gap: "14px", fontSize: "13.5px", flexWrap: "wrap" }}>
            {LINKS.filter((l) => !l.adminOnly || user.tipo === "admin").map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  opacity: pathname === l.href ? 1 : 0.6,
                  fontWeight: pathname === l.href ? 700 : 500,
                  color: "inherit",
                  textDecoration: pathname === l.href ? "underline" : "none",
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="direita">
          <span className="equipe">
            <span className="avatar-ini">{user ? iniciais(user.nome) : "—"}</span>
            {loading ? "Verificando…" : user ? user.nome : "Sem sessão"}
          </span>
          {user ? (
            <button className="btn-sair" onClick={sair} style={{ cursor: "pointer", background: "none", border: "none", color: "inherit" }}>
              <i className="ph ph-sign-out"></i> Sair
            </button>
          ) : (
            <Link href="/admin/login" className="btn-sair">
              <i className="ph ph-sign-in"></i> Entrar
            </Link>
          )}
          <Link href="/" className="btn-sair">
            <i className="ph ph-arrow-up-left"></i> Site
          </Link>
        </div>
      </div>
    </header>
  );
}
