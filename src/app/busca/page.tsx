import { BookGrid } from "@/components/BookCard";
import { CategoryChips } from "@/components/CategoryChips";
import { SearchBox } from "@/components/SearchBox";
import { listCategories, searchBooks } from "@/lib/catalog";

export const metadata = { title: "Buscar" };

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 100).trim();
  const [results, categories] = await Promise.all([
    q.length >= 2 ? searchBooks(q) : Promise.resolve([]),
    listCategories({ onlyWithBooks: true }),
  ]);

  return (
    <div className="container-page space-y-6 py-6">
      <SearchBox defaultValue={q} autoFocus={!q} />
      {!q ? (
        <>
          <h1 className="text-2xl font-semibold">Explorar categorias</h1>
          <CategoryChips categories={categories} />
        </>
      ) : q.length < 2 ? (
        <p className="text-muted">Digite pelo menos 2 letras.</p>
      ) : results.length === 0 ? (
        <p className="text-muted">Nada encontrado para “{q}”.</p>
      ) : (
        <>
          <h1 className="text-xl font-semibold">
            {results.length} {results.length === 1 ? "resultado" : "resultados"} para “{q}”
          </h1>
          <BookGrid books={results} />
        </>
      )}
    </div>
  );
}
