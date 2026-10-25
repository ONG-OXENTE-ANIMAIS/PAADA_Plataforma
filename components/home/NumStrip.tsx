"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Estatisticas = {
  campanhas_ativas: number;
  doacoes_pagas: number;
  total_arrecadado: number;
};

const fmt = (v: number) => Math.round(v).toLocaleString("pt-BR");

export default function NumStrip() {
  /* Valores institucionais estáticos como fallback; quando o Supabase está
     configurado, três dos quatro números vêm da API. */
  const [stats, setStats] = useState<Estatisticas | null>(null);

  useEffect(() => {
    let ativo = true;
    apiFetch<Estatisticas>("/api/estatisticas/publicas")
      .then((d) => ativo && setStats(d))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <section className="num-strip">
      <svg className="num-bg">
        <use href="#sol" />
      </svg>
      <div className="tit">
        <svg className="sol" style={{ width: "14px", height: "14px" }}>
          <use href="#sol" />
        </svg>
        A Oxente em números — desde 2019
      </div>
      <div className="nums" style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div className="num" data-reveal>
          <b data-count="1.2" data-dec="1" data-pre="R$ " data-suf=" mi">
            0
          </b>
          <span>
            arrecadados e repassados
            {stats ? ` · ${fmt(stats.total_arrecadado)} nesta plataforma` : ""}
          </span>
        </div>
        <div className="num" data-reveal style={{ "--d": "0.08s" } as React.CSSProperties}>
          <b data-count="38">0</b>
          <span>
            vaquinhas já realizadas
            {stats ? ` · ${fmt(stats.campanhas_ativas)} no ar agora` : ""}
          </span>
        </div>
        <div className="num" data-reveal style={{ "--d": "0.16s" } as React.CSSProperties}>
          <b data-count="12.4" data-dec="1" data-suf=" mil">
            0
          </b>
          <span>
            doações realizadas
            {stats ? ` · ${fmt(stats.doacoes_pagas)} confirmadas aqui` : ""}
          </span>
        </div>
        <div className="num" data-reveal style={{ "--d": "0.24s" } as React.CSSProperties}>
          <b data-count="8.3" data-dec="1" data-suf=" mil">
            0
          </b>
          <span>animais alcançados</span>
        </div>
      </div>
    </section>
  );
}
