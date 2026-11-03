import Link from "next/link";
import type { Book } from "@/lib/catalog";
import { BookCard } from "./BookCard";

// Prateleira horizontal com rolagem lateral
export function Shelf({ title, href, books, subtitle }: {
  title: string;
  href?: string;
  books: Book[];
  subtitle?: (b: Book) => string;
}) {
  if (books.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="container-page mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {href && <Link href={href} className="shrink-0 text-sm text-accent underline">Ver todos</Link>}
      </div>
      <div className="mx-auto max-w-5xl">
        <ul className="flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:px-6">
          {books.map((b) => (
            <li key={b.id} className="w-32 shrink-0 snap-start sm:w-40">
              <BookCard book={b} subtitle={subtitle?.(b)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
