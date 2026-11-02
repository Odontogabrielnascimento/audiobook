import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Armazenamento de arquivos com dois modos:
//  - local: pasta ./storage (para desenvolvimento)
//  - s3:    qualquer servico compativel com S3 (Cloudflare R2 recomendado: nao cobra trafego de saida)

export const driver = process.env.STORAGE_DRIVER === "s3" ? "s3" : "local";
const LOCAL_ROOT = path.resolve(process.cwd(), "storage");

let s3: S3Client | null = null;
function s3Client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return s3;
}
const bucket = () => process.env.S3_BUCKET!;

export function isSafeKey(key: string) {
  return /^(audio|covers)\/[a-zA-Z0-9._-]+$/.test(key);
}

function localPath(key: string) {
  if (!isSafeKey(key)) throw new Error("Chave de arquivo invalida");
  return path.join(LOCAL_ROOT, key);
}

// URL para o navegador enviar o arquivo diretamente (PUT)
export async function uploadUrl(key: string, contentType: string) {
  if (driver === "s3") {
    return getSignedUrl(
      s3Client(),
      new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
      { expiresIn: 60 * 30 },
    );
  }
  return `/api/admin/upload-local?key=${encodeURIComponent(key)}`;
}

export async function saveLocal(key: string, body: ReadableStream<Uint8Array>) {
  const file = localPath(key);
  await mkdir(path.dirname(file), { recursive: true });
  await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream), createWriteStream(file));
}

// URL temporaria de leitura (apenas no modo s3)
export async function signedReadUrl(key: string, seconds = 60 * 10) {
  return getSignedUrl(s3Client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: seconds,
  });
}

export async function deleteFile(key: string | null) {
  if (!key) return;
  try {
    if (driver === "s3") await s3Client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    else await unlink(localPath(key));
  } catch {
    // arquivo ja removido: ignorar
  }
}

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".m4b": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Entrega um arquivo local com suporte a Range (necessario para avancar/voltar no audio)
export async function serveLocal(key: string, rangeHeader: string | null, cacheControl: string) {
  const file = localPath(key);
  const info = await stat(file).catch(() => null);
  if (!info) return new Response("Arquivo nao encontrado", { status: 404 });
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const size = info.size;
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
  };

  const m = rangeHeader?.match(/bytes=(\d*)-(\d*)/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
