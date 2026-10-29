"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/fx/ToastProvider";
import { useRequireSession } from "@/hooks/useSession";

type Indicadores = {
  campanhas_ativas: number;
  doacoes_pagas: number;
  parceiros_ativos: number;
  mensagens_recebidas: number;
  total_arrecadado: number;
};

const BRL = (v: number) => "R$ " + Math.round(v).toLocaleString("pt-BR");

const CARDS: {
  campo: keyof Indicadores;
  titulo: string;
  icone: string;
  fmt?: (v: number) => string;
  href: string;
}[] = [
  { campo: "total_arrecadado", titulo: "Arrecadado (doações pagas)", icone: "piggy-bank", fmt: BRL, href: "/admin/doacoes" },
  { campo: "campanhas_ativas", titulo: "Campanhas ativas", icone: "megaphone", href: "/admin/campanhas" },
  { campo: "doacoes_pagas", titulo: "Doações pagas", icone: "hand-heart", href: "/admin/doacoes" },
  { campo: "parceiros_ativos", titulo: "Parceiros ativos", icone: "handshake", href: "/admin/parceiros" },
  { campo: "mensagens_recebidas", titulo: "Mensagens na fila", icone: "chats-circle", href: "/admin/contato" },
];

export default function AdminDashboardPage() {
  const { user, loading: sessaoCarregando } = useRequireSession();
  const toast = useToast();
  const [ind, setInd] = useState<Indicadores | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    apiFetch<Indicadores>("/api/admin/dashboard")
      .then((d) => ativo && (setInd(d), setErro(null)))
      .catch((e: Error) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [user]);

  if (sessaoCarregando || !user) return null;

  return (
    <section className="screen active" data-screen="admin">
      <div className="adm-head wrap">
        <h1>Painel da Oxente</h1>
        <p>
          Olá, {user.nome.split(" ")[0]} — aqui está o retrato atual da
          plataforma. Escolha uma área no menu acima para gerenciar.
        </p>
        <div className="adm-bts">
          <Link href="/admin/nova" className="btn btn-laranja">
            <i className="ph ph-plus"></i> Criar vaquinha
          </Link>
          <Link href="/admin/campanhas" className="btn btn-fantasma">
            <i className="ph ph-megaphone"></i> Gerenciar campanhas
          </Link>
        </div>
      </div>

      <div className="fita" aria-hidden="true"></div>

      <section className="sec sec-wide">
        {erro ? (
          <div className="form-card" style={{ maxWidth: "640px" }}>
            <h3>
              <i className="ph ph-warning" style={{ color: "#b3261e" }}></i> Não
              foi possível carregar os indicadores
            </h3>
            <p style={{ opacity: 0.8 }}>{erro}</p>
            <p className="nota-bib">
              Se o erro mencionar Supabase, confira as variáveis de ambiente no
              servidor (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).
            </p>
          </div>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "18px" }}
          >
            {CARDS.map((c, i) => (
              <Link
                key={c.campo}
                href={c.href}
                className="form-card"
                style={{ textDecoration: "none", color: "inherit" }}
                data-reveal
              >
                <i
                  className={`ph-fill ph-${c.icone}`}
                  style={{ fontSize: "26px", color: "var(--laranja)" }}
                ></i>
                <h3 style={{ fontSize: "1.7rem", margin: "10px 0 2px" }}>
                  {ind ? (c.fmt ? c.fmt(ind[c.campo]) : ind[c.campo]) : "…"}
                </h3>
                <span style={{ fontSize: "13.5px", opacity: 0.75 }}>{c.titulo}</span>
                <span style={{ position: "absolute", inset: 0, fontSize: 0 }} aria-hidden="true">
                  {i}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="compartilhar" style={{ marginTop: "40px" }}>
          <div>
            <h3>
              Fluxo do <em>dinheiro</em>
            </h3>
            <p>
              Cada doação nasce PENDENTE no banco e só vira PAGA quando o
              webhook do Efi confirma o pagamento — o valor arrecadado da
              campanha é creditado por uma função atômica no banco, nunca pelo
              navegador.
            </p>
          </div>
          <div className="grupo-bts" style={{ alignItems: "center" }}>
            <Link href="/admin/doacoes" className="btn btn-marrom">
              <i className="ph ph-list-heart"></i> Ver doações
            </Link>
            <Link href="/admin/contato" className="btn btn-areia">
              <i className="ph ph-chats-circle"></i> Fila de mensagens
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
