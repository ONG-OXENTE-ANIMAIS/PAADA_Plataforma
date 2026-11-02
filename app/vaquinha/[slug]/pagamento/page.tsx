import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutView from "@/components/vaquinha/CheckoutView";
import { campanhasService } from "@/services/campanhas.service";
import { campaignFromApi, type Freq } from "@/lib/campaigns";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { campanha } = await campanhasService.getBySlug(decodeURIComponent(slug));
    return {
      title: `Pagamento Seguro: ${campanha.titulo} — Oxente`,
      description: `Apoie a campanha ${campanha.titulo} via Pix ou Cartão de Crédito.`,
    };
  } catch {
    return { title: "Pagamento — Oxente" };
  }
}

export default async function PagamentoVaquinhaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  let detalhe: Awaited<ReturnType<typeof campanhasService.getBySlug>>;
  try {
    detalhe = await campanhasService.getBySlug(decodeURIComponent(slug));
  } catch {
    notFound();
  }

  const base = campaignFromApi(detalhe.campanha);
  const valorParam = typeof sp.valor === "string" ? parseFloat(sp.valor) : NaN;
  const valorInicial = !Number.isNaN(valorParam) && valorParam >= 1 ? valorParam : 50;
  const freqInicial: Freq = sp.freq === "mes" && base.recurring ? "mes" : "unica";
  const metodoInicial: "pix" | "cartao" = sp.metodo === "cartao" ? "cartao" : "pix";

  return (
    <CheckoutView
      campaign={base}
      valorInicial={valorInicial}
      freqInicial={freqInicial}
      metodoInicial={metodoInicial}
    />
  );
}
