import { ApiError } from "@/lib/api/errors";
import { contatoCreateSchema, contatoUpdateSchema } from "@/lib/validations/schemas";
import { ContatoRepository } from "@/repositories/contato.repository";

const repo = new ContatoRepository();
export const contatoService = {
  async list(filters: Parameters<ContatoRepository["list"]>[0]) {
    const result = await repo.list(filters);
    return { data: result.data, count: result.count };
  },
  async get(id: string) {
    const contact = await repo.findById(id);
    if (!contact) throw new ApiError(404, "NOT_FOUND", "Mensagem não encontrada.");
    return contact;
  },
  async create(input: unknown) {
    const data = contatoCreateSchema.parse(input);
    return repo.create({ ...data, status: "RECEBIDA" });
  },
  async update(id: string, input: unknown) {
    const data = contatoUpdateSchema.parse(input);
    const contact = await repo.update(id, { ...data });
    if (!contact) throw new ApiError(404, "NOT_FOUND", "Mensagem não encontrada.");
    return contact;
  },
  async remove(id: string) {
    const contact = await repo.findById(id);
    if (!contact) throw new ApiError(404, "NOT_FOUND", "Mensagem não encontrada.");
    await repo.remove(id);
  },
};
