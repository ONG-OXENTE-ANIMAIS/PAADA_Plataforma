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
      <div className="footer-cta">
        <div>
          <h3>
            Sua causa também pode <em>morar aqui</em>.
          </h3>
          <p>
            ONG parceira monta a vaquinha em minutos, com identidade própria, e
            recebe os repasses direto na conta. A gente cuida do resto.
          </p>
        </div>
        <div className="grupo-bts">
          <Link href="/admin" className="btn btn-laranja">
            <i className="ph ph-target"></i> Vaquinha única
          </Link>
          <Link href="/admin?tipo=recorrente" className="btn btn-areia" id="footRec">
            <i className="ph ph-arrows-clockwise"></i> Vaquinha recorrente
          </Link>
        </div>
      </div>
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
          <h5>Para ONGs & parceiros</h5>
          <ul>
            <li>
              <Link href="/admin">Criar vaquinha única</Link>
            </li>
            <li>
              <Link href="/admin?tipo=recorrente" id="footRec2">
                Criar vaquinha recorrente
              </Link>
            </li>
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
              <DummyButton>(81) 9 8888-0000</DummyButton>
            </li>
            <li>
              <DummyButton>@oxente.doa</DummyButton>
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
