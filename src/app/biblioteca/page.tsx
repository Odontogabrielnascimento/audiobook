import Link from "next/link";
import { CategoryChips } from "@/components/CategoryChips";
import { SearchBox } from "@/components/SearchBox";
import { Shelf } from "@/components/Shelf";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { booksInCategory, continueListening, listBooks, listCategories, popularBooks, shelfBooks } from "@/lib/catalog";
import { config, formatBRL } from "@/lib/config";

export const metadata = { title: "Início" };

export default async function Biblioteca() {
  const user = await getCurrentUser();
  const [recent, popular, categories, access, resume, wantList] = await Promise.all([
    listBooks({ limit: 12 }),
    popularBooks(12),
    listCategories({ onlyWithBooks: true }),
    user ? hasAccess(user) : Promise.resolve(false),
    user ? continueListening(user.id) : Promise.resolve([]),
    user ? shelfBooks(user.id, "want") : Promise.resolve([]),
  ]);
  const byCategory = await Promise.all(categories.map(async (c) => ({ c, books: await booksInCategory(c.id, 12) })));
  const empty = recent.length === 0;

  return (
    <div className="py-6">
      <div className="container-page mb-8 space-y-4">
        <SearchBox />
        <CategoryChips categories={categories} />
      </div>

      {!access && (
        <div className="container-page mb-8">
          <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p>Assine para ouvir todos os títulos por {formatBRL(config.planPrice)}/mês.</p>
            <Link href={user ? "/assinar" : "/cadastro"} className="btn-primary shrink-0">Assinar</Link>
          </div>
        </div>
      )}

      {empty && <p className="container-page text-muted">Nenhum título publicado ainda.</p>}

      <Shelf title="Continuar ouvindo" books={resume} subtitle={(b) => (b as typeof resume[number]).chapter_title} />
      <Shelf title="Quero ouvir" href="/estante" books={wantList} />
      <Shelf title="Novidades" books={recent} />
      <Shelf title="Mais ouvidos" books={popular} />
      {byCategory.map(({ c, books }) => (
        <Shelf key={c.id} title={c.name} href={`/categoria/${c.slug}`} books={books} />
      ))}
    </div>
  );
}
