import Link from "next/link";
import { coverUrl, type Book } from "@/lib/catalog";
import { formatDuration } from "@/lib/config";

export function Cover({ book, className = "" }: { book: { id: string; title: string; cover_key: string | null }; className?: string }) {
  const url = coverUrl(book);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`Capa de ${book.title}`} loading="lazy"
      className={`aspect-square w-full rounded-2xl object-cover shadow-lg shadow-black/40 ring-1 ring-white/5 ${className}`} />
  ) : (
    <div className={`glow flex aspect-square w-full items-end rounded-2xl p-3 font-serif text-sm font-semibold leading-tight ring-1 ring-white/5 ${className}`}>
      {book.title}
    </div>
  );
}

export function Stars({ value, count }: { value: number | null; count: number }) {
  if (!value || count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" aria-label={`Nota ${value.toFixed(1)} de 5, ${count} avaliações`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
      {value.toFixed(1).replace(".", ",")}
      <span className="opacity-70">({count})</span>
    </span>
  );
}

export function BookCard({ book, subtitle }: { book: Book; subtitle?: string }) {
  return (
    <Link href={`/livro/${book.slug}`} className="group block">
      <div className="relative">
        <Cover book={book} className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl" />
        <span className="absolute bottom-2 right-2 grid h-9 w-9 translate-y-1 place-items-center rounded-full text-accent-ink opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"
          style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent))" }} aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug">{book.title}</p>
      <p className="truncate text-xs text-muted">{subtitle ?? book.author}</p>
      {!subtitle && (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
          {book.total_seconds > 0 && <span className="text-xs text-muted">{formatDuration(book.total_seconds)}</span>}
          <Stars value={book.rating_avg} count={book.rating_count} />
        </div>
      )}
    </Link>
  );
}

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {books.map((b) => <BookCard key={b.id} book={b} />)}
    </div>
  );
}

// Cartao largo de "Continuar ouvindo" com barra de progresso
export function ContinueCard({ book }: { book: Book & { chapter_title: string; elapsed_seconds: number } }) {
  const pct = book.total_seconds ? Math.min(100, Math.round((book.elapsed_seconds / book.total_seconds) * 100)) : 0;
  const left = Math.max(0, book.total_seconds - book.elapsed_seconds);
  return (
    <Link href={`/livro/${book.slug}`} className="card flex w-72 items-center gap-3 p-2.5 pr-4 transition hover:border-accent/50 sm:w-80">
      <div className="w-16 shrink-0"><Cover book={book} className="!rounded-xl" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{book.title}</p>
        <p className="truncate text-xs text-muted">{book.chapter_title}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-muted">{left > 0 ? `${formatDuration(left)} restantes` : "Quase lá"}</p>
      </div>
    </Link>
  );
}
