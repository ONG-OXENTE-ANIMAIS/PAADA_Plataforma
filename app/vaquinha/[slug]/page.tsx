import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CampaignDetail from "@/components/vaquinha/CampaignDetail";
import { campanhasService } from "@/services/campanhas.service";
import { doacoesService } from "@/services/doacoes.service";
import { campaignFromApi, type Atualizacao, type Uso } from "@/lib/campaigns";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { campanha } = await campanhasService.getBySlug(decodeURIComponent(slug));
    const titulo = `${campanha.titulo} — Oxente`;
    return {
      title: titulo,
      description: campanha.descricao?.split(/\n{2,}/)[0]?.slice(0, 160) ?? titulo,
      openGraph: {
        title: titulo,
        description: campanha.descricao?.split(/\n{2,}/)[0]?.slice(0, 160) ?? undefined,
        images: campanha.imagem ? [campanha.imagem] : undefined,
      },
    };
  } catch {
    return { title: "Vaquinha não encontrada — Oxente" };
  }
}

export default async function VaquinhaPage({ params, searchParams }: Props) {
  const { slug } = await params;

  let detalhe: Awaited<ReturnType<typeof campanhasService.getBySlug>>;
  try {
    detalhe = await campanhasService.getBySlug(decodeURIComponent(slug));
  } catch {
    notFound();
  }

  /* Status de uma doação que voltou do checkout do Mercado Pago
     (back_urls: /vaquinha/[slug]?doacao=ID&token=TOKEN). */
  const sp = await searchParams;
  const doacaoId = typeof sp.doacao === "string" ? sp.doacao : null;
  const token = typeof sp.token === "string" ? sp.token : null;
  let retornoDoacao: string | null = null;
  if (doacaoId && token) {
    try {
      const doacao = await doacoesService.getPublic(doacaoId, token);
      retornoDoacao = doacao.status;
    } catch {
      retornoDoacao = null;
    }
  }

  const { campanha, submetas, atualizacoes } = detalhe;
  const base = campaignFromApi(campanha);

  const usos: Uso[] = submetas.map((s) => ({
    label: s.titulo,
    valor: Number(s.valor),
  }));

  const updates: Atualizacao[] = atualizacoes.map((a) => ({
    tag: a.tag ?? "Novidade",
    iso: "",
    data: "—",
    titulo: a.titulo,
    texto: a.texto,
  }));

  return (
    <CampaignDetail
      key={campanha.slug}
      campaign={{ ...base, story: (campanha.descricao ?? "").split(/\n{2,}/).filter(Boolean), usos, updates }}
      retornoDoacao={retornoDoacao}
    />
  );
}
