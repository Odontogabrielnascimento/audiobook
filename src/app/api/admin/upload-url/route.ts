import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { uploadUrl } from "@/lib/storage";

const AUDIO = [".mp3", ".m4a", ".m4b", ".aac", ".ogg", ".opus", ".wav"];
const IMAGE = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response("Proibido", { status: 403 });
  const { kind, filename, contentType } = (await req.json().catch(() => ({}))) as Record<string, string>;
  const ext = (filename?.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? "").toLowerCase();
  const allowed = kind === "audio" ? AUDIO : kind === "cover" ? IMAGE : [];
  if (!allowed.includes(ext)) return new Response("Tipo de arquivo não aceito", { status: 400 });
  const key = `${kind === "audio" ? "audio" : "covers"}/${randomUUID()}${ext}`;
  return Response.json({ key, url: await uploadUrl(key, contentType || "application/octet-stream") });
}
