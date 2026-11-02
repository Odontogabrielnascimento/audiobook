import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const body = await req.json().catch(() => null);
  const { bookId, chapterId, position } = body ?? {};
  const uuid = /^[0-9a-f-]{36}$/;
  if (!uuid.test(String(bookId)) || !uuid.test(String(chapterId)) || !Number.isFinite(position)) {
    return new Response(null, { status: 400 });
  }
  await query(
    `insert into progress (user_id, book_id, chapter_id, position_seconds, updated_at)
     select $1, c.book_id, c.id, $4, now() from chapters c where c.id = $3 and c.book_id = $2
     on conflict (user_id, book_id) do update set
       chapter_id = excluded.chapter_id, position_seconds = excluded.position_seconds, updated_at = now()`,
    [user.id, bookId, chapterId, Math.max(0, Math.floor(position))],
  );
  return new Response(null, { status: 204 });
}
