"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookById, listChapters, slugify } from "@/lib/catalog";
import { pool, query, queryOne } from "@/lib/db";
import { deleteFile, isSafeKey } from "@/lib/storage";
import { getSetting, setSetting } from "@/lib/settings";

export type BookFormState = { error?: string; ok?: boolean } | undefined;

function readBook(form: FormData) {
  return {
    title: String(form.get("title") || "").trim(),
    author: String(form.get("author") || "").trim(),
    narrator: String(form.get("narrator") || "").trim() || null,
    description: String(form.get("description") || "").trim(),
  };
}

async function uniqueSlug(title: string, ignoreId?: string, table: "books" | "categories" | "series" = "books") {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await queryOne<{ id: string }>(`select id from ${table} where slug = $1`, [slug]);
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

const UUID = /^[0-9a-f-]{36}$/;

// Grava categorias e serie do livro a partir do formulario
async function saveTaxonomy(bookId: string, form: FormData) {
  const categoryIds = form.getAll("categories").map(String).filter((id) => UUID.test(id));
  await query("delete from book_categories where book_id = $1", [bookId]);
  if (categoryIds.length) {
    await query(
      `insert into book_categories (book_id, category_id)
       select $1, id from categories where id = any($2::uuid[]) on conflict do nothing`,
      [bookId, categoryIds],
    );
  }

  let seriesId: string | null = String(form.get("series_id") || "");
  const newSeries = String(form.get("series_new") || "").trim();
  if (seriesId === "new" && newSeries) {
    const [row] = await query<{ id: string }>(
      "insert into series (slug, name) values ($1, $2) returning id",
      [await uniqueSlug(newSeries, undefined, "series"), newSeries],
    );
    seriesId = row.id;
  } else if (!UUID.test(seriesId)) {
    seriesId = null;
  }
  await query("update books set featured = $2 where id = $1", [bookId, form.get("featured") === "on"]);

  const pos = Number(form.get("series_position"));
  await query("update books set series_id = $2, series_position = $3 where id = $1", [
    bookId,
    seriesId,
    seriesId && Number.isInteger(pos) && pos > 0 ? pos : null,
  ]);
  // Remove series que ficaram sem livros
  await query("delete from series s where not exists (select 1 from books b where b.series_id = s.id)");
}

export async function createBook(_: BookFormState, form: FormData): Promise<BookFormState> {
  await requireAdmin();
  const b = readBook(form);
  if (!b.title || !b.author) return { error: "Título e autor são obrigatórios." };
  const [row] = await query<{ id: string }>(
    `insert into books (slug, title, author, narrator, description) values ($1, $2, $3, $4, $5) returning id`,
    [await uniqueSlug(b.title), b.title, b.author, b.narrator, b.description],
  );
  await saveTaxonomy(row.id, form);
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
  await saveTaxonomy(bookId, form);
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

// ---- Categorias ----

export async function createCategory(form: FormData) {
  await requireAdmin();
  const name = String(form.get("name") || "").trim().slice(0, 60);
  if (!name) return;
  await query(
    `insert into categories (slug, name, position)
     values ($1, $2, coalesce((select max(position) + 1 from categories), 1))`,
    [await uniqueSlug(name, undefined, "categories"), name],
  );
  revalidatePath("/admin/categorias");
}

export async function renameCategory(id: string, name: string) {
  await requireAdmin();
  const n = name.trim().slice(0, 60);
  if (!UUID.test(id) || !n) return;
  await query("update categories set name = $2 where id = $1", [id, n]);
  revalidatePath("/admin/categorias");
}

export async function moveCategory(id: string, direction: -1 | 1) {
  await requireAdmin();
  const list = await query<{ id: string }>("select id from categories order by position, name");
  const i = list.findIndex((c) => c.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await query(
    "update categories c set position = v.pos from unnest($1::uuid[]) with ordinality as v(id, pos) where c.id = v.id",
    [list.map((c) => c.id)],
  );
  revalidatePath("/admin/categorias");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  if (!UUID.test(id)) return;
  await query("delete from categories where id = $1", [id]);
  revalidatePath("/admin/categorias");
}

// ---- Aparencia ----

export async function setHeroImage(key: string | null) {
  await requireAdmin();
  if (key !== null && (!isSafeKey(key) || !key.startsWith("covers/"))) throw new Error("Chave inválida");
  const old = await getSetting("hero_key");
  await setSetting("hero_key", key);
  if (old && old !== key) await deleteFile(old);
  revalidatePath("/", "layout");
}
