"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/fx/ToastProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const fecharMenu = () => document.body.classList.remove("nav-open");

  return (
    <header className="navbar">
      <div className="wrap">
        <Link
          href="/"
          className="logo"
          aria-label="Ir para a página inicial"
          onClick={fecharMenu}
        >
          <svg className="sol">
            <use href="#sol" />
          </svg>
          oxente
        </Link>
        <nav className="nav-links" aria-label="Navegação principal">
          <Link
            href="/vaquinhas"
            className={pathname === "/vaquinhas" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Vaquinhas
          </Link>
          <Link
            href="/como-ajudar"
            className={pathname === "/como-ajudar" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Como Ajudar
          </Link>
          <Link
            href="/parcerias"
            className={pathname === "/parcerias" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Parcerias
          </Link>
          <Link
            href="/sobre"
            className={pathname === "/sobre" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Sobre a Oxente
          </Link>
        </nav>
        <div className="nav-acoes">
          <button
            className="btn btn-fantasma"
            style={{ padding: "11px 20px" }}
            onClick={() => {
              toast("Bem-vindo de volta, Equipe Oxente!", "hand-heart");
              router.push("/admin");
            }}
          >
            Entrar
          </button>
          <Link
            href="/admin"
            className="btn btn-laranja"
            style={{ padding: "11px 20px" }}
            onClick={fecharMenu}
          >
            <i className="ph ph-plus"></i> Criar vaquinha
          </Link>
          <button
            className="burger"
            id="burger"
            aria-label="Abrir menu"
            onClick={() => document.body.classList.toggle("nav-open")}
          >
            <i className="ph ph-list"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
