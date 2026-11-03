import Link from "next/link";
import { coverUrl, type Book } from "@/lib/catalog";
import { formatDuration } from "@/lib/config";

export function Cover({ book, className = "" }: { book: { id: string; title: string; cover_key: string | null }; className?: string }) {
  const url = coverUrl(book);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Capa de ${book.title}`} loading="lazy" className={`aspect-square w-full rounded-xl object-cover shadow-sm ${className}`} />
  ) : (
    <div className={`flex aspect-square w-full items-end rounded-xl bg-accent-soft p-3 font-serif text-sm font-semibold leading-tight ${className}`}>
      {book.title}
    </div>
  );
}

export function Stars({ value, count }: { value: number | null; count: number }) {
  if (!value || count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" aria-label={`Nota ${value.toFixed(1)} de 5, ${count} avaliações`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-warn" aria-hidden><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
      {value.toFixed(1).replace(".", ",")}
      <span>({count})</span>
    </span>
  );
}

export function BookCard({ book, subtitle }: { book: Book; subtitle?: string }) {
  return (
    <Link href={`/livro/${book.slug}`} className="group block">
      <Cover book={book} className="transition group-hover:-translate-y-0.5 group-hover:shadow-md" />
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
      <p className="truncate text-xs text-muted">{subtitle ?? book.author}</p>
      {!subtitle && (
        <div className="flex flex-wrap items-center gap-x-2">
          {book.total_seconds > 0 && <span className="text-xs text-muted">{formatDuration(book.total_seconds)}</span>}
          <Stars value={book.rating_avg} count={book.rating_count} />
        </div>
      )}
    </Link>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:grid-cols-5">
      {books.map((b) => <BookCard key={b.id} book={b} />)}
    </div>
  );
}
