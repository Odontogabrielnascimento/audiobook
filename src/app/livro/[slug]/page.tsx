import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover, Stars } from "@/components/BookCard";
import { Shelf } from "@/components/Shelf";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import {
  booksInSeries, categoriesOfBook, coverUrl, getBookBySlug, getShelfStatus, getUserRating, listChapters,
} from "@/lib/catalog";
import { formatDuration } from "@/lib/config";
import { queryOne } from "@/lib/db";
import { BookActions } from "../BookActions";
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

  const [chapters, access, progress, categories, seriesBooks, shelf, myRating] = await Promise.all([
    listChapters(book.id),
    user ? hasAccess(user) : Promise.resolve(false),
    user
      ? queryOne<{ chapter_id: string; position_seconds: number }>(
          "select chapter_id, position_seconds from progress where user_id = $1 and book_id = $2",
          [user.id, book.id],
        )
      : Promise.resolve(null),
    categoriesOfBook(book.id),
    book.series_id ? booksInSeries(book.series_id) : Promise.resolve([]),
    user ? getShelfStatus(user.id, book.id) : Promise.resolve(null),
    user ? getUserRating(user.id, book.id) : Promise.resolve(null),
  ]);
  const otherVolumes = seriesBooks.filter((b) => b.id !== book.id);

  return (
    <div className="pb-8">
      {/* Fundo com a capa desfocada */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden" aria-hidden>
        {coverUrl(book) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl(book)!} alt="" className="h-full w-full scale-125 object-cover opacity-50 blur-3xl" />
        ) : (
          <div className="glow h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/70 to-paper" />
      </div>
      <div className="container-page pt-8">
        <div className="grid gap-8 md:grid-cols-[300px_1fr] md:items-end">
          <div className="mx-auto w-full max-w-[280px] md:max-w-none">
            <Cover book={book} className="!rounded-3xl shadow-2xl shadow-black/60" />
          </div>
          <div>
            {!book.published && <p className="mb-2 text-sm font-semibold text-warn">Rascunho (visível só para administradores)</p>}
            {book.series_name && (
              <Link href={`/serie/${book.series_slug}`} className="text-sm font-semibold text-accent hover:underline">
                {book.series_name}{book.series_position ? ` · Volume ${book.series_position}` : ""}
              </Link>
            )}
            <h1 className="mt-1 text-4xl font-semibold leading-[1.05] sm:text-5xl">{book.title}</h1>
            <p className="mt-2 text-lg text-ink/80">
              {book.author}
              {book.narrator && <> · Narração: {book.narrator}</>}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
              <span>{book.chapter_count} {book.chapter_count === 1 ? "faixa" : "faixas"} · {formatDuration(book.total_seconds)}</span>
              <Stars value={book.rating_avg} count={book.rating_count} />
            </div>
            {categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link key={c.id} href={`/categoria/${c.slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs backdrop-blur hover:border-accent">
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-5">
              <BookActions bookId={book.id} loggedIn={!!user} canRate={access} shelf={shelf} myRating={myRating} />
            </div>
            {book.description && (
              <div className="mt-6 max-w-prose whitespace-pre-line leading-relaxed">{book.description}</div>
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

      {otherVolumes.length > 0 && (
        <div className="mt-12">
          <Shelf
            title={`Mais da série ${book.series_name}`}
            href={`/serie/${book.series_slug}`}
            books={otherVolumes}
            subtitle={(b) => (b.series_position ? `Volume ${b.series_position}` : b.author)}
          />
        </div>
      )}
    </div>
  );
}
