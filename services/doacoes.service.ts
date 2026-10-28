import { ApiError } from "@/lib/api/errors";
import { doacaoCreateSchema, doacaoStatusUpdateSchema } from "@/lib/validations/schemas";
import { DoacoesRepository } from "@/repositories/doacoes.repository";
import { CampanhasRepository } from "@/repositories/campanhas.repository";
import { criarPreferenciaPagamento } from "@/lib/payments/mercadopago";
import type { DoacaoRow } from "@/types/database.types";

const repo = new DoacoesRepository();
const campanhas = new CampanhasRepository();

const publicDonation = (donation: DoacaoRow) => ({
  id: donation.id,
  campanha_id: donation.campanha_id,
  status: donation.status,
  valor: Number(donation.valor),
  atualizado_em: donation.atualizado_em,
  pago_em: donation.pago_em,
});

function assertPaymentConfigured() {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    throw new ApiError(503, "PAYMENT_PROVIDER_NOT_CONFIGURED", "O provedor de pagamento ainda não foi configurado.");
  }
}

export const doacoesService = {
  async create(input: unknown) {
    const data = doacaoCreateSchema.parse(input);
    assertPaymentConfigured();
    const campaign = await campanhas.findById(data.campanha_id);
    if (!campaign || campaign.status !== "ATIVA" || !campaign.meta_isvisible) throw new ApiError(422, "CAMPAIGN_NOT_ACCEPTING_DONATIONS", "Esta campanha não está aceitando doações.");
    if (campaign.data_fim && new Date(campaign.data_fim) < new Date()) throw new ApiError(422, "CAMPAIGN_ENDED", "Esta campanha já foi encerrada.");
    if (data.mensal && !campaign.mensal) throw new ApiError(422, "RECURRING_NOT_ALLOWED", "Esta campanha não aceita doações recorrentes.");
    if (data.anonimo && (data.email || data.nome)) throw new ApiError(400, "ANONYMOUS_EMAIL", "Doações anônimas não devem incluir e-mail.");

    const donation = await repo.create({
      campanha_id: data.campanha_id,
      valor: data.valor,
      status: "PENDENTE",
      txid: `PAADA-${crypto.randomUUID()}`,
      assinatura_id: null,
      payment_id: null,
    });

    try {
      const preference = await criarPreferenciaPagamento({
        donationId: donation.id,
        donationToken: donation.id,
        campaignSlug: campaign.slug,
        txid: donation.txid,
        amount: Number(donation.valor),
        campaignTitle: campaign.titulo,
        payerEmail: data.email ?? undefined,
        payerName: data.nome ?? undefined,
      });
      await repo.update(donation.id, { payment_id: preference.id });
      return { donation: publicDonation(donation), checkout_url: preference.checkoutUrl, pagamento: preference };
    } catch (error) {
      await repo.setStatus(donation.id, "CANCELADA");
      throw error;
    }
  },
  async list(filters: Parameters<DoacoesRepository["list"]>[0]) {
    const result = await repo.list(filters);
    return { data: result.data, count: result.count };
  },
  async getAdmin(id: string) {
    const donation = await repo.findById(id);
    if (!donation) throw new ApiError(404, "NOT_FOUND", "Doação não encontrada.");
    return donation;
  },
  async getPublic(id: string, token: string | null) {
    const donation = await repo.findById(id);
    if (!donation) throw new ApiError(404, "NOT_FOUND", "Doação não encontrada.");
    if (token !== donation.id) throw new ApiError(404, "NOT_FOUND", "Doação não encontrada.");
    return publicDonation(donation);
  },
  async updateStatus(id: string, input: unknown) {
    const data = doacaoStatusUpdateSchema.parse(input);
    const donation = await repo.findById(id);
    if (!donation) throw new ApiError(404, "NOT_FOUND", "Doação não encontrada.");
    if (donation.status === "PAGA" && data.status === "CANCELADA") throw new ApiError(409, "INVALID_STATUS_CHANGE", "Uma doação paga deve usar reembolso, não cancelamento.");
    await repo.setStatus(id, data.status);
    return repo.findById(id);
  },
  async confirm(id: string, paymentId: string, amount: number) {
    return repo.confirm(id, paymentId, amount);
  },
};
