import "server-only";
import { query, queryOne } from "./db";

export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  narrator: string | null;
  description: string;
  cover_key: string | null;
  published: boolean;
  series_id: string | null;
  series_position: number | null;
  series_name: string | null;
  series_slug: string | null;
  total_seconds: number;
  chapter_count: number;
  rating_avg: number | null;
  rating_count: number;
};

export type Chapter = {
  id: string;
  book_id: string;
  position: number;
  title: string;
  audio_key: string;
  duration_seconds: number;
};

export type Category = { id: string; slug: string; name: string; position: number; book_count: number };
export type Series = { id: string; slug: string; name: string };

export function coverUrl(b: { id: string; cover_key: string | null }) {
  return b.cover_key ? `/api/cover/${b.id}?v=${encodeURIComponent(b.cover_key.split("/")[1])}` : null;
}

// Consulta base de livros: duracao, faixas, serie e media de avaliacoes
const BOOK_SELECT = `
  select b.id, b.slug, b.title, b.author, b.narrator, b.description, b.cover_key, b.published,
         b.series_id, b.series_position, s.name as series_name, s.slug as series_slug,
         coalesce(c.total_seconds, 0)::int as total_seconds,
         coalesce(c.chapter_count, 0)::int as chapter_count,
         r.rating_avg::float as rating_avg,
         coalesce(r.rating_count, 0)::int as rating_count
    from books b
    left join series s on s.id = b.series_id
    left join lateral (
      select sum(duration_seconds) as total_seconds, count(*) as chapter_count
        from chapters where book_id = b.id
    ) c on true
    left join lateral (
      select round(avg(stars), 1) as rating_avg, count(*) as rating_count
        from ratings where book_id = b.id
    ) r on true`;

// Remove acentos para a busca (sem depender de extensoes do Postgres)
const ACCENTS_FROM = "áàâãäéèêëíìîïóòôõöúùûüçñ";
const ACCENTS_TO = "aaaaaeeeeiiiiooooouuuucn";
const norm = (expr: string) => `translate(lower(${expr}), '${ACCENTS_FROM}', '${ACCENTS_TO}')`;

export function listBooks({ includeUnpublished = false, limit = 500 } = {}) {
  return query<Book>(
    `${BOOK_SELECT} ${includeUnpublished ? "" : "where b.published"}
     order by b.created_at desc limit $1`,
    [limit],
  );
}

// Mais ouvidos: numero de pessoas que comecaram o livro
export function popularBooks(limit = 12) {
  return query<Book>(
    `${BOOK_SELECT}
      left join lateral (select count(*) as listeners from progress where book_id = b.id) p on true
     where b.published and p.listeners > 0
     order by p.listeners desc, b.created_at desc limit $1`,
    [limit],
  );
}

export function booksInCategory(categoryId: string, limit = 500) {
  return query<Book>(
    `${BOOK_SELECT}
      join book_categories bc on bc.book_id = b.id and bc.category_id = $1
     where b.published order by b.created_at desc limit $2`,
    [categoryId, limit],
  );
}

export function booksInSeries(seriesId: string, includeUnpublished = false) {
  return query<Book>(
    `${BOOK_SELECT} where b.series_id = $1 ${includeUnpublished ? "" : "and b.published"}
     order by b.series_position nulls last, b.created_at`,
    [seriesId],
  );
}

export function searchBooks(q: string, limit = 60) {
  const term = `%${q.trim().replace(/[%_\\]/g, "")}%`;
  return query<Book>(
    `${BOOK_SELECT}
     where b.published and (
       ${norm("b.title")} like ${norm("$1")} or
       ${norm("b.author")} like ${norm("$1")} or
       ${norm("coalesce(b.narrator, '')")} like ${norm("$1")} or
       ${norm("coalesce(s.name, '')")} like ${norm("$1")}
     )
     order by (${norm("b.title")} like ${norm("$1")}) desc, b.created_at desc
     limit $2`,
    [term, limit],
  );
}

export function getBookBySlug(slug: string) {
  return queryOne<Book>(`${BOOK_SELECT} where b.slug = $1`, [slug]);
}

export function getBookById(id: string) {
  return queryOne<Book>(`${BOOK_SELECT} where b.id = $1`, [id]);
}

export function listChapters(bookId: string) {
  return query<Chapter>(
    "select * from chapters where book_id = $1 order by position, created_at",
    [bookId],
  );
}

export function continueListening(userId: string, limit = 12) {
  return query<Book & { chapter_title: string; position_seconds: number }>(
    `${BOOK_SELECT}
      join progress p on p.book_id = b.id and p.user_id = $1
      join chapters ch on ch.id = p.chapter_id
      left join shelf sh on sh.book_id = b.id and sh.user_id = $1
     where b.published and (sh.status is null or sh.status <> 'finished')
     order by p.updated_at desc limit $2`.replace(
      "select b.id,",
      "select ch.title as chapter_title, p.position_seconds, b.id,",
    ),
    [userId, limit],
  );
}

// ---- Categorias ----

export function listCategories({ onlyWithBooks = false } = {}) {
  return query<Category>(
    `select c.id, c.slug, c.name, c.position,
            (select count(*) from book_categories bc join books b on b.id = bc.book_id
              where bc.category_id = c.id and b.published)::int as book_count
       from categories c
      order by c.position, c.name`,
  ).then((rows) => (onlyWithBooks ? rows.filter((c) => c.book_count > 0) : rows));
}

export function getCategoryBySlug(slug: string) {
  return queryOne<Category>("select *, 0 as book_count from categories where slug = $1", [slug]);
}

export function categoriesOfBook(bookId: string) {
  return query<Category>(
    `select c.*, 0 as book_count from categories c
       join book_categories bc on bc.category_id = c.id
      where bc.book_id = $1 order by c.position, c.name`,
    [bookId],
  );
}

// ---- Series ----

export function listSeries() {
  return query<Series>("select id, slug, name from series order by name");
}

export function getSeriesBySlug(slug: string) {
  return queryOne<Series>("select id, slug, name from series where slug = $1", [slug]);
}

// ---- Estante e avaliacoes ----

export type ShelfStatus = "want" | "finished";

export async function getShelfStatus(userId: string, bookId: string) {
  const row = await queryOne<{ status: ShelfStatus }>(
    "select status from shelf where user_id = $1 and book_id = $2",
    [userId, bookId],
  );
  return row?.status ?? null;
}

export function shelfBooks(userId: string, status: ShelfStatus) {
  return query<Book>(
    `${BOOK_SELECT} join shelf sh on sh.book_id = b.id and sh.user_id = $1 and sh.status = $2
     where b.published order by sh.updated_at desc`,
    [userId, status],
  );
}

export async function getUserRating(userId: string, bookId: string) {
  const row = await queryOne<{ stars: number }>(
    "select stars from ratings where user_id = $1 and book_id = $2",
    [userId, bookId],
  );
  return row?.stars ?? null;
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}
