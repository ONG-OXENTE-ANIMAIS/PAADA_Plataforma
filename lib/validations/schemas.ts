import { z } from "zod";

const id = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const money = z.coerce.number().finite().positive().max(10_000_000);
const optionalText = z.string().trim().max(2000).nullable().optional();
const url = z.string().trim().url().max(2000);

export const campanhaStatusSchema = z.enum(["RASCUNHO", "ATIVA", "PAUSADA", "CONCLUIDA", "CANCELADA"]);
export const doacaoStatusSchema = z.enum(["PENDENTE", "PAGA", "CANCELADA", "REEMBOLSADA"]);
export const contatoStatusSchema = z.enum(["RECEBIDA", "EM_ANALISE", "RESPONDIDA", "ARQUIVADA"]);

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Forma base (sem refinamentos) para reutilizar em create/update. */
const campanhaBaseSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  subtitulo: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(100).optional(),
  descricao: optionalText,
  categoria: z.string().trim().max(80).nullable().optional(),
  localidade: z.string().trim().max(120).nullable().optional(),
  status: campanhaStatusSchema.default("RASCUNHO"),
  meta_arrecadacao: money.nullish().optional(),
  data_inicio: z.string().date().nullable().optional(),
  data_fim: z.string().date().nullable().optional(),
  mensal: z.boolean().default(false),
  destaque: z.boolean().default(false),
  meta_isvisible: z.boolean().default(false),
});

function validarDatas(
  data: { data_inicio?: string | null; data_fim?: string | null },
  ctx: z.RefinementCtx,
) {
  if (data.data_inicio && data.data_fim && new Date(data.data_fim) < new Date(data.data_inicio)) {
    ctx.addIssue({ code: "custom", path: ["data_fim"], message: "A data de término deve ser posterior à data de início." });
  }
}

export const campanhaCreateSchema = campanhaBaseSchema.superRefine(validarDatas);
export const campanhaUpdateSchema = campanhaBaseSchema.partial().superRefine(validarDatas);

export const submetaCreateSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  valor: money,
  ordem: z.coerce.number().int().min(0).default(0),
});

export const atualizacaoCreateSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  texto: z.string().trim().min(10).max(10000),
  tag: z.string().trim().max(60).nullable().optional(),
});

/** Forma base (sem refinamentos) para reutilizar em create/update/upload. */
const imagemBaseSchema = z.object({
  url,
  descricao: optionalText,
  papel: z.string().trim().min(1).max(40).default("GALERIA"),
  ordem: z.coerce.number().int().min(0).default(0),
});

export const imagemCreateSchema = imagemBaseSchema;

/** Payload de upload: URL externa OU arquivo (data URL gravado no Storage). */
const imagemUploadShape = imagemBaseSchema.extend({
  url: url.optional(),
  arquivo: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/, "Envie uma imagem PNG, JPG, WEBP ou GIF.")
    .max(7_000_000)
    .optional(),
});

export const imagemUploadSchema = imagemUploadShape.refine((d) => Boolean(d.arquivo || d.url), {
  message: "Informe a URL da imagem ou envie um arquivo.",
});

export const imagemUpdateSchema = imagemUploadShape.partial();

export const doacaoCreateSchema = z.object({
  campanha_id: id,
  valor: money,
  nome: z.string().trim().min(2).max(160).nullable().optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  telefone: z.string().trim().max(30).nullable().optional(),
  anonimo: z.boolean().default(false),
  mensal: z.boolean().default(false),
});

export const doacaoStatusUpdateSchema = z.object({
  status: z.enum(["CANCELADA", "REEMBOLSADA"]),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  login: z.string().trim().min(3).max(60).regex(/^[a-zA-Z0-9._-]+$/),
  senha: z.string().min(10).max(128),
  tipo: z.enum(["admin", "operador"]),
  ativo: z.boolean().default(true),
});

export const usuarioUpdateSchema = usuarioCreateSchema.partial();

export const parceiroCreateSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  sigla: z.string().trim().max(20).nullable().optional(),
  tipo: z.string().trim().max(80).nullable().optional(),
  area: z.string().trim().max(80).nullable().optional(),
  localidade: z.string().trim().max(120).nullable().optional(),
  descricao: optionalText,
  logo_url: url.nullable().optional(),
  desde: z.string().trim().max(30).nullable().optional(),
  destaque: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

export const contatoCreateSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  assunto: z.string().trim().min(3).max(160),
  mensagem: z.string().trim().min(10).max(5000),
  tipo: z.enum(["CONTATO", "SUGESTAO"]).default("CONTATO"),
  website: z.string().max(0).optional(),
});

export const contatoUpdateSchema = z.object({
  status: contatoStatusSchema,
});

export const loginSchema = z.object({
  login: z.string().trim().min(1).max(254),
  senha: z.string().min(1).max(128),
});
