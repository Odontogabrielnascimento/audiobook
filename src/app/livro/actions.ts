"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

const UUID = /^[0-9a-f-]{36}$/;

async function bookSlug(bookId: string) {
  const b = await queryOne<{ slug: string }>("select slug from books where id = $1 and published", [bookId]);
  return b?.slug ?? null;
}

export async function setShelf(bookId: string, status: "want" | "finished" | null) {
  const user = await getCurrentUser();
  if (!user || !UUID.test(bookId)) return { error: "Faça login para usar a estante." };
  const slug = await bookSlug(bookId);
  if (!slug) return { error: "Livro não encontrado." };
  if (status === null) {
    await query("delete from shelf where user_id = $1 and book_id = $2", [user.id, bookId]);
  } else {
    await query(
      `insert into shelf (user_id, book_id, status) values ($1, $2, $3)
       on conflict (user_id, book_id) do update set status = excluded.status, updated_at = now()`,
      [user.id, bookId, status],
    );
  }
  revalidatePath(`/livro/${slug}`);
  return { ok: true };
}

export async function rateBook(bookId: string, stars: number) {
  const user = await getCurrentUser();
  if (!user || !UUID.test(bookId)) return { error: "Faça login para avaliar." };
  if (!(await hasAccess(user))) return { error: "Apenas assinantes podem avaliar." };
  const n = Math.round(stars);
  if (n < 1 || n > 5) return { error: "Nota inválida." };
  const slug = await bookSlug(bookId);
  if (!slug) return { error: "Livro não encontrado." };
  await query(
    `insert into ratings (user_id, book_id, stars) values ($1, $2, $3)
     on conflict (user_id, book_id) do update set stars = excluded.stars, updated_at = now()`,
    [user.id, bookId, n],
  );
  revalidatePath(`/livro/${slug}`);
  return { ok: true };
}
