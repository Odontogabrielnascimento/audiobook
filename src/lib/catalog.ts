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
  total_seconds: number;
  chapter_count: number;
};

export type Chapter = {
  id: string;
  book_id: string;
  position: number;
  title: string;
  audio_key: string;
  duration_seconds: number;
};

export function coverUrl(b: { id: string; cover_key: string | null }) {
  return b.cover_key ? `/api/cover/${b.id}?v=${encodeURIComponent(b.cover_key.split("/")[1])}` : null;
}

const BOOK_COLS = `b.id, b.slug, b.title, b.author, b.narrator, b.description, b.cover_key, b.published,
  coalesce(sum(c.duration_seconds), 0)::int as total_seconds, count(c.id)::int as chapter_count`;

export function listBooks({ includeUnpublished = false } = {}) {
  return query<Book>(
    `select ${BOOK_COLS} from books b left join chapters c on c.book_id = b.id
      ${includeUnpublished ? "" : "where b.published"}
      group by b.id order by b.created_at desc`,
  );
}

export function getBookBySlug(slug: string) {
  return queryOne<Book>(
    `select ${BOOK_COLS} from books b left join chapters c on c.book_id = b.id
      where b.slug = $1 group by b.id`,
    [slug],
  );
}

export function getBookById(id: string) {
  return queryOne<Book>(
    `select ${BOOK_COLS} from books b left join chapters c on c.book_id = b.id
      where b.id = $1 group by b.id`,
    [id],
  );
}

export function listChapters(bookId: string) {
  return query<Chapter>(
    "select * from chapters where book_id = $1 order by position, created_at",
    [bookId],
  );
}

export function continueListening(userId: string) {
  return query<Book & { chapter_title: string; position_seconds: number }>(
    `select ${BOOK_COLS}, ch.title as chapter_title, p.position_seconds
       from progress p
       join books b on b.id = p.book_id and b.published
       join chapters ch on ch.id = p.chapter_id
       left join chapters c on c.book_id = b.id
      where p.user_id = $1
      group by b.id, ch.title, p.position_seconds, p.updated_at
      order by p.updated_at desc limit 6`,
    [userId],
  );
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "livro";
}
