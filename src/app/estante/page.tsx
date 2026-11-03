import Link from "next/link";
import { BookCard, BookGrid } from "@/components/BookCard";
import { requireUser } from "@/lib/auth";
import { continueListening, shelfBooks } from "@/lib/catalog";

export const metadata = { title: "Minha estante" };

const TABS = [
  { key: "ouvindo", label: "Ouvindo" },
  { key: "quero", label: "Quero ouvir" },
  { key: "concluidos", label: "Concluídos" },
] as const;

export default async function Estante({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const user = await requireUser("/estante");
  const requested = (await searchParams).aba;
  const aba = TABS.some((t) => t.key === requested) ? requested! : "ouvindo";

  const listening = aba === "ouvindo" ? await continueListening(user.id, 100) : [];
  const books =
    aba === "quero" ? await shelfBooks(user.id, "want") : aba === "concluidos" ? await shelfBooks(user.id, "finished") : [];

  const emptyText: Record<string, string> = {
    ouvindo: "Os livros que você começar aparecem aqui.",
    quero: "Toque em “Quero ouvir” na página de um livro para guardá-lo aqui.",
    concluidos: "Quando terminar um livro, ele aparece aqui.",
  };
  const isEmpty = aba === "ouvindo" ? listening.length === 0 : books.length === 0;

  return (
    <div className="container-page py-6">
      <h1 className="mb-4 text-3xl font-semibold">Minha estante</h1>
      <nav className="mb-6 flex gap-2 border-b border-line" aria-label="Seções da estante">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/estante?aba=${t.key}`}
            aria-current={aba === t.key ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${aba === t.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {isEmpty ? (
        <p className="text-muted">{emptyText[aba]} <Link href="/biblioteca" className="text-accent underline">Explorar o catálogo</Link></p>
      ) : aba === "ouvindo" ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:grid-cols-5">
          {listening.map((b) => <BookCard key={b.id} book={b} subtitle={b.chapter_title} />)}
        </div>
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  );
}
