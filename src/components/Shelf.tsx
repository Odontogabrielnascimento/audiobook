import Link from "next/link";
import type { Book } from "@/lib/catalog";
import { BookCard } from "./BookCard";

// Prateleira horizontal com rolagem lateral
export function Shelf({ title, eyebrow, href, books, subtitle }: {
  title: string;
  eyebrow?: string;
  href?: string;
  books: Book[];
  subtitle?: (b: Book) => string;
}) {
  if (books.length === 0) return null;
  return (
    <section className="mb-12">
      <div className="container-page mb-4 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted hover:border-accent hover:text-ink">
            Ver todos
          </Link>
        )}
      </div>
      <div className="mx-auto max-w-6xl">
        <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:px-6">
          {books.map((b) => (
            <li key={b.id} className="w-36 shrink-0 snap-start sm:w-44">
              <BookCard book={b} subtitle={subtitle?.(b)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="container-page mb-4 text-2xl font-semibold sm:text-3xl">{title}</h2>
      <div className="mx-auto max-w-6xl">
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:px-6">{children}</div>
      </div>
    </section>
  );
}
