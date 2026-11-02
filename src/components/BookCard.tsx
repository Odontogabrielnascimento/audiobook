import Link from "next/link";
import { coverUrl, type Book } from "@/lib/catalog";
import { formatDuration } from "@/lib/config";

export function Cover({ book, className = "" }: { book: { id: string; title: string; cover_key: string | null }; className?: string }) {
  const url = coverUrl(book);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Capa de ${book.title}`} className={`aspect-square w-full rounded-xl object-cover shadow-sm ${className}`} />
  ) : (
    <div className={`flex aspect-square w-full items-end rounded-xl bg-accent-soft p-3 font-serif text-sm font-semibold leading-tight ${className}`}>
      {book.title}
    </div>
  );
}

export function BookCard({ book, subtitle }: { book: Book; subtitle?: string }) {
  return (
    <Link href={`/livro/${book.slug}`} className="group block">
      <Cover book={book} className="transition group-hover:-translate-y-0.5 group-hover:shadow-md" />
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
      <p className="truncate text-xs text-muted">{subtitle ?? book.author}</p>
      {!subtitle && book.total_seconds > 0 && <p className="text-xs text-muted">{formatDuration(book.total_seconds)}</p>}
    </Link>
  );
}
