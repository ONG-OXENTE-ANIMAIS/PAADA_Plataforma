"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DummyButton from "@/components/ui/DummyButton";

export default function Footer() {
  const [ano, setAno] = useState(2025);
  useEffect(() => setAno(new Date().getFullYear()), []);
  return (
    <footer className="footer">
      <div className="fita" aria-hidden="true"></div>
      <div className="footer-grid">
        <div>
          <span className="logo">
            <svg className="sol">
              <use href="#sol" />
            </svg>
            oxente
          </span>
          <p className="sobre">
            Plataforma de doações do Instituto Oxente. Feita no Recife,
            Pernambuco — ajudando o Nordeste inteiro.
          </p>
        </div>
        <div>
          <h5>Plataforma</h5>
          <ul>
            <li>
              <Link href="/vaquinhas">Vaquinhas</Link>
            </li>
            <li>
              <Link href="/como-ajudar">Como Ajudar</Link>
            </li>
            <li>
              <Link href="/sobre">Sobre a Oxente</Link>
            </li>
            <li>
              <Link href="/sugestoes">Sugestões</Link>
            </li>
          </ul>
        </div>
        <div>
          <h5>Parceiros</h5>
          <ul>
            {/* <li>
              <Link href="/admin">Criar vaquinha única</Link>
            </li>
            <li>
              <Link href="/admin?tipo=recorrente" id="footRec2">
                Criar vaquinha recorrente
              </Link>
            </li> */}
            <li>
              <Link href="/parcerias">Cadastrar parceria</Link>
            </li>
          </ul>
        </div>
        <div>
          <h5>Contato</h5>
          <ul>
            <li>
              <a href="mailto:ola@oxente.org">ola@oxente.org</a>
            </li>
            <li>
              <a href="http://wa.me/+5581988880000" target="_blank">(81) 9 8888-0000</a>
            </li>
            <li>
            <a href="https://www.instagram.com/projetooxenteanimais/" target="_blank">@projetooxenteanimais</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="wordmark" aria-hidden="true">
        oxente
        <svg className="sol">
          <use href="#sol" />
        </svg>
      </div>
      <div className="footer-fim">
        <span suppressHydrationWarning>
          © {ano} Instituto Oxente
        </span>
        <span>Protótipo visual — todos os valores e doações são simulados.</span>
      </div>
    </footer>
  );
}
