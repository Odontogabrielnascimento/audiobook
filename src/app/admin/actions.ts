"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookById, listChapters, slugify } from "@/lib/catalog";
import { pool, query, queryOne } from "@/lib/db";
import { deleteFile, isSafeKey } from "@/lib/storage";

export type BookFormState = { error?: string; ok?: boolean } | undefined;

function readBook(form: FormData) {
  return {
    title: String(form.get("title") || "").trim(),
    author: String(form.get("author") || "").trim(),
    narrator: String(form.get("narrator") || "").trim() || null,
    description: String(form.get("description") || "").trim(),
  };
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await queryOne<{ id: string }>("select id from books where slug = $1", [slug]);
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function createBook(_: BookFormState, form: FormData): Promise<BookFormState> {
  await requireAdmin();
  const b = readBook(form);
  if (!b.title || !b.author) return { error: "Título e autor são obrigatórios." };
  const [row] = await query<{ id: string }>(
    `insert into books (slug, title, author, narrator, description) values ($1, $2, $3, $4, $5) returning id`,
    [await uniqueSlug(b.title), b.title, b.author, b.narrator, b.description],
  );
  redirect(`/admin/livros/${row.id}`);
}

export async function updateBook(bookId: string, _: BookFormState, form: FormData): Promise<BookFormState> {
  await requireAdmin();
  const b = readBook(form);
  if (!b.title || !b.author) return { error: "Título e autor são obrigatórios." };
  await query(
    `update books set title = $2, author = $3, narrator = $4, description = $5 where id = $1`,
    [bookId, b.title, b.author, b.narrator, b.description],
  );
  revalidatePath(`/admin/livros/${bookId}`);
  return { ok: true };
}

export async function setCover(bookId: string, key: string) {
  await requireAdmin();
  if (!isSafeKey(key) || !key.startsWith("covers/")) throw new Error("Chave inválida");
  const old = await queryOne<{ cover_key: string | null }>("select cover_key from books where id = $1", [bookId]);
  await query("update books set cover_key = $2 where id = $1", [bookId, key]);
  if (old?.cover_key && old.cover_key !== key) await deleteFile(old.cover_key);
  revalidatePath(`/admin/livros/${bookId}`);
}

export async function togglePublished(bookId: string) {
  await requireAdmin();
  await query("update books set published = not published where id = $1", [bookId]);
  revalidatePath(`/admin/livros/${bookId}`);
  revalidatePath("/admin");
}

export async function deleteBook(bookId: string) {
  await requireAdmin();
  const book = await getBookById(bookId);
  if (!book) redirect("/admin");
  const chapters = await listChapters(bookId);
  await query("delete from books where id = $1", [bookId]);
  await Promise.all([deleteFile(book.cover_key), ...chapters.map((c) => deleteFile(c.audio_key))]);
  redirect("/admin");
}

export async function addChapter(bookId: string, input: { title: string; key: string; duration: number }) {
  await requireAdmin();
  if (!isSafeKey(input.key) || !input.key.startsWith("audio/")) throw new Error("Chave inválida");
  await query(
    `insert into chapters (book_id, position, title, audio_key, duration_seconds)
     values ($1, coalesce((select max(position) + 1 from chapters where book_id = $1), 1), $2, $3, $4)`,
    [bookId, input.title.trim() || "Faixa", input.key, Math.round(input.duration) || 0],
  );
  revalidatePath(`/admin/livros/${bookId}`);
}

export async function renameChapter(chapterId: string, title: string) {
  await requireAdmin();
  const row = await queryOne<{ book_id: string }>(
    "update chapters set title = $2 where id = $1 returning book_id",
    [chapterId, title.trim() || "Faixa"],
  );
  if (row) revalidatePath(`/admin/livros/${row.book_id}`);
}

export async function moveChapter(chapterId: string, direction: -1 | 1) {
  await requireAdmin();
  const ch = await queryOne<{ book_id: string }>("select book_id from chapters where id = $1", [chapterId]);
  if (!ch) return;
  const list = await listChapters(ch.book_id);
  const i = list.findIndex((c) => c.id === chapterId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (let k = 0; k < list.length; k++) {
      await client.query("update chapters set position = $2 where id = $1", [list[k].id, k + 1]);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
  revalidatePath(`/admin/livros/${ch.book_id}`);
}

export async function deleteChapter(chapterId: string) {
  await requireAdmin();
  const row = await queryOne<{ book_id: string; audio_key: string }>(
    "delete from chapters where id = $1 returning book_id, audio_key",
    [chapterId],
  );
  if (!row) return;
  await deleteFile(row.audio_key);
  revalidatePath(`/admin/livros/${row.book_id}`);
}
