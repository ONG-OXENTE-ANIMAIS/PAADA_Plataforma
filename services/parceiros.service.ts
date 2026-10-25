import { ApiError } from "@/lib/api/errors";
import { parceiroCreateSchema } from "@/lib/validations/schemas";
import { ParceirosRepository } from "@/repositories/parceiros.repository";

const repo = new ParceirosRepository();
export const parceirosService = {
  async list(filters: Parameters<ParceirosRepository["list"]>[0]) {
    const result = await repo.list(filters);
    return { data: result.data, count: result.count };
  },
  async get(id: string) {
    const partner = await repo.findById(id);
    if (!partner) throw new ApiError(404, "NOT_FOUND", "Parceiro não encontrado.");
    return partner;
  },
  async create(input: unknown) {
    return repo.create(parceiroCreateSchema.parse(input));
  },
  async update(id: string, input: unknown) {
    const partner = await repo.update(id, parceiroCreateSchema.partial().parse(input));
    if (!partner) throw new ApiError(404, "NOT_FOUND", "Parceiro não encontrado.");
    return partner;
  },
  async remove(id: string) {
    const partner = await repo.findById(id);
    if (!partner) throw new ApiError(404, "NOT_FOUND", "Parceiro não encontrado.");
    await repo.remove(id);
  },
};
