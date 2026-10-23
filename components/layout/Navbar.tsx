"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/fx/ToastProvider";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [aberto, setAberto] = useState(false);

  /* body.nav-open é a fonte da verdade (CSS, BodyClassManager e HashLink
     também a removem); o observer mantém ícone e aria em sincronia com ela. */
  useEffect(() => {
    const sync = () => setAberto(document.body.classList.contains("nav-open"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const fecharMenu = () => document.body.classList.remove("nav-open");
  const alternarMenu = () => document.body.classList.toggle("nav-open");

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
            href="/contato"
            className={pathname === "/contato" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Contato
          </Link>
          <Link
            href="/sobre"
            className={pathname === "/sobre" ? "ativo" : undefined}
            onClick={fecharMenu}
          >
            Sobre a Oxente
          </Link>
        </nav>
        {/* <div className="nav-acoes">
          <button
            className="btn btn-fantasma"
            onClick={() => {
              fecharMenu();
              toast("Bem-vindo de volta, Equipe Oxente!", "hand-heart");
              router.push("/admin");
            }}
          >
            Entrar
          </button>
          <Link
            href="/admin"
            className="btn btn-laranja"
            onClick={fecharMenu}
          >
            <i className="ph ph-plus"></i> Criar vaquinha
          </Link>
        </div> */}
        <button
          className="burger"
          id="burger"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          onClick={alternarMenu}
        >
          <i className={aberto ? "ph ph-x" : "ph ph-list"}></i>
        </button>
      </div>
    </header>
  );
}
