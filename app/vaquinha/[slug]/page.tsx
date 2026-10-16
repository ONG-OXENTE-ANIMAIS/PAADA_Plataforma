import CampaignDetail from "@/components/vaquinha/CampaignDetail";

export default async function VaquinhaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CampaignDetail key={slug} slug={slug} />;
}
