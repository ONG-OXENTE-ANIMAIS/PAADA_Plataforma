import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/errors";
import { usuarioCreateSchema, usuarioUpdateSchema } from "@/lib/validations/schemas";
import { UsuariosRepository } from "@/repositories/usuarios.repository";
import type { UsuarioRow } from "@/types/database.types";

const repo = new UsuariosRepository();
const publicUser = (user: UsuarioRow) => ({ id: String(user.id), nome: user.nome, email: user.email, login: user.login, tipo: user.tipo, ativo: user.ativo, criado_em: user.criado_em, atualizado_em: user.atualizado_em });

export const usuariosService = {
  async list(page: number, limit: number) {
    const result = await repo.list(page, limit);
    return { data: result.data.map(publicUser), count: result.count };
  },
  async get(id: string) {
    const user = await repo.findById(id);
    if (!user) throw new ApiError(404, "NOT_FOUND", "Usuário não encontrado.");
    return publicUser(user);
  },
  async authenticate(login: string, password: string) {
    const user = await repo.findByLogin(login);
    if (!user || !user.ativo || !(await bcrypt.compare(password, user.senha))) throw new ApiError(401, "INVALID_CREDENTIALS", "Usuário ou senha inválidos.");
    return publicUser(user);
  },
  async create(input: unknown) {
    const data = usuarioCreateSchema.parse(input);
    const senha = await bcrypt.hash(data.senha, 12);
    return publicUser(await repo.create({ ...data, senha }));
  },
  async update(id: string, input: unknown) {
    const data = usuarioUpdateSchema.parse(input);
    const current = await repo.findById(id);
    if (!current) throw new ApiError(404, "NOT_FOUND", "Usuário não encontrado.");
    if (current.tipo === "admin" && (data.tipo === "operador" || data.ativo === false)) {
      if ((await repo.countAdmins()) <= 1) throw new ApiError(409, "LAST_ADMIN", "O sistema deve manter ao menos um administrador ativo.");
    }
    const senha = data.senha ? await bcrypt.hash(data.senha, 12) : undefined;
    const user = await repo.update(id, { ...data, senha });
    if (!user) throw new ApiError(404, "NOT_FOUND", "Usuário não encontrado.");
    return publicUser(user);
  },
  async remove(id: string) {
    const user = await repo.findById(id);
    if (!user) throw new ApiError(404, "NOT_FOUND", "Usuário não encontrado.");
    if (user.tipo === "admin" && user.ativo && (await repo.countAdmins()) <= 1) throw new ApiError(409, "LAST_ADMIN", "O sistema deve manter ao menos um administrador ativo.");
    await repo.remove(id);
  },
};
