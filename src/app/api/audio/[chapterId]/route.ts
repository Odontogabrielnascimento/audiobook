import { getCurrentUser, hasAccess } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { driver, serveLocal, signedReadUrl } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login", { status: 401 });
  if (!(await hasAccess(user))) return new Response("Assinatura necessária", { status: 402 });
  if (!/^[0-9a-f-]{36}$/.test(chapterId)) return new Response("Não encontrado", { status: 404 });

  const ch = await queryOne<{ audio_key: string; published: boolean }>(
    "select c.audio_key, b.published from chapters c join books b on b.id = c.book_id where c.id = $1",
    [chapterId],
  );
  if (!ch || (!ch.published && user.role !== "admin")) return new Response("Não encontrado", { status: 404 });

  if (driver === "s3") {
    // Link temporario direto do armazenamento (o player renova se expirar)
    const url = await signedReadUrl(ch.audio_key, 60 * 60 * 6);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
  }
  return serveLocal(ch.audio_key, req.headers.get("range"), "private, no-store");
}
