import { notFound } from "next/navigation";
import { Cover } from "@/components/BookCard";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { coverUrl, getBookBySlug, listChapters } from "@/lib/catalog";
import { formatDuration } from "@/lib/config";
import { queryOne } from "@/lib/db";
import { ChapterList } from "./ChapterList";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const book = await getBookBySlug((await params).slug);
  return { title: book?.title ?? "Livro" };
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const book = await getBookBySlug(slug);
  if (!book || (!book.published && user?.role !== "admin")) notFound();

  const [chapters, access, progress] = await Promise.all([
    listChapters(book.id),
    user ? hasAccess(user) : Promise.resolve(false),
    user
      ? queryOne<{ chapter_id: string; position_seconds: number }>(
          "select chapter_id, position_seconds from progress where user_id = $1 and book_id = $2",
          [user.id, book.id],
        )
      : Promise.resolve(null),
  ]);

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-full max-w-[260px]">
          <Cover book={book} />
        </div>
        <div>
          {!book.published && <p className="mb-2 text-sm font-semibold text-warn">Rascunho (visível só para administradores)</p>}
          <h1 className="text-3xl font-semibold leading-tight">{book.title}</h1>
          <p className="mt-1 text-muted">
            {book.author}
            {book.narrator && <> · Narração: {book.narrator}</>}
          </p>
          <p className="mt-1 text-sm text-muted">
            {book.chapter_count} {book.chapter_count === 1 ? "faixa" : "faixas"} · {formatDuration(book.total_seconds)}
          </p>
          {book.description && (
            <div className="mt-5 max-w-prose whitespace-pre-line leading-relaxed">{book.description}</div>
          )}
        </div>
      </div>

      <ChapterList
        book={{ id: book.id, slug: book.slug, title: book.title, author: book.author, coverUrl: coverUrl(book) }}
        chapters={chapters.map((c) => ({ id: c.id, title: c.title, duration: c.duration_seconds }))}
        gate={!user ? "login" : access ? null : "subscribe"}
        progress={progress ? { chapterId: progress.chapter_id, position: progress.position_seconds } : null}
      />
    </div>
  );
}
