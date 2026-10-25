import "server-only";
import { ApiError } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "campanhas";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Recebe uma data URL (image/*;base64) enviada pelo formulário e grava o
 * arquivo no Supabase Storage, retornando a URL pública. O banco guarda
 * apenas a referência — nunca o binário.
 */
export async function uploadImagemCampanha(dataUrl: string, campanhaId: string): Promise<string> {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new ApiError(400, "INVALID_IMAGE", "Arquivo de imagem inválido.");
  const [, mime, base64] = match;
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(mime)) {
    throw new ApiError(400, "INVALID_IMAGE_TYPE", "Formato de imagem não permitido. Use PNG, JPG, WEBP ou GIF.");
  }
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new ApiError(400, "INVALID_IMAGE", "Arquivo de imagem vazio.");
  if (buffer.length > MAX_BYTES) throw new ApiError(400, "IMAGE_TOO_LARGE", "A imagem deve ter no máximo 5 MB.");

  const db = createAdminClient();
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const path = `${campanhaId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, { contentType: mime, upsert: false });
  if (error) {
    if (error.message?.toLowerCase().includes("bucket not found") || (error as { statusCode?: string }).statusCode === "404") {
      throw new ApiError(500, "STORAGE_BUCKET_MISSING", `O bucket "${BUCKET}" não existe no Supabase Storage. Crie-o como bucket público (ver README).`);
    }
    throw new ApiError(500, "STORAGE_ERROR", "Não foi possível enviar a imagem para o storage.");
  }
  return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
