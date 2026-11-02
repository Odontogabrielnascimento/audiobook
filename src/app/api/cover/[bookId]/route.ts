import { queryOne } from "@/lib/db";
import { driver, serveLocal, signedReadUrl } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(bookId)) return new Response("Não encontrado", { status: 404 });
  const book = await queryOne<{ cover_key: string | null }>("select cover_key from books where id = $1", [bookId]);
  if (!book?.cover_key) return new Response("Não encontrado", { status: 404 });
  if (driver === "s3") {
    const url = await signedReadUrl(book.cover_key, 60 * 60 * 24);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "public, max-age=3600" } });
  }
  return serveLocal(book.cover_key, req.headers.get("range"), "public, max-age=86400");
}
