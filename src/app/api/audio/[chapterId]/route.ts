import { getCurrentUser, hasAccess } from "@/lib/auth";
import { isChapterFree, type BookAccess } from "@/lib/catalog";
import { queryOne } from "@/lib/db";
import { driver, serveLocal, signedReadUrl } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Faça login", { status: 401 });
  if (!/^[0-9a-f-]{36}$/.test(chapterId)) return new Response("Não encontrado", { status: 404 });

  const ch = await queryOne<{ audio_key: string; published: boolean; access: BookAccess; idx: number }>(
    `select c.audio_key, b.published, b.access,
            (select count(*) from chapters x where x.book_id = c.book_id
              and (x.position, x.created_at) < (c.position, c.created_at))::int as idx
       from chapters c join books b on b.id = c.book_id where c.id = $1`,
    [chapterId],
  );
  if (!ch || (!ch.published && user.role !== "admin")) return new Response("Não encontrado", { status: 404 });

  // Faixa gratis (livro gratis ou amostra) dispensa assinatura; o resto exige
  if (!isChapterFree(ch.access, ch.idx) && !(await hasAccess(user))) {
    return new Response("Assinatura necessária", { status: 402 });
  }

  if (driver === "s3") {
    // Link temporario direto do armazenamento (o player renova se expirar)
    const url = await signedReadUrl(ch.audio_key, 60 * 60 * 6);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } });
  }
  return serveLocal(ch.audio_key, req.headers.get("range"), "private, no-store");
}
