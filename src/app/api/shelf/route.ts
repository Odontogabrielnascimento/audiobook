import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

// Chamado pelo player ao terminar a ultima faixa: marca o livro como concluido
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const { bookId } = (await req.json().catch(() => ({}))) as { bookId?: string };
  if (!/^[0-9a-f-]{36}$/.test(String(bookId))) return new Response(null, { status: 400 });
  await query(
    `insert into shelf (user_id, book_id, status)
     select $1, id, 'finished' from books where id = $2 and published
     on conflict (user_id, book_id) do update set status = 'finished', updated_at = now()`,
    [user.id, bookId],
  );
  return new Response(null, { status: 204 });
}
