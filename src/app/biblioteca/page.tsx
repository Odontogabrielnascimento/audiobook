import Link from "next/link";
import { ContinueCard } from "@/components/BookCard";
import { CategoryChips } from "@/components/CategoryChips";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SearchBox } from "@/components/SearchBox";
import { Row, Shelf } from "@/components/Shelf";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import {
  booksInCategory, continueListening, coverUrl, featuredBooks, listBooks, listCategories, popularBooks, shelfBooks,
} from "@/lib/catalog";
import { config, formatBRL, formatDuration } from "@/lib/config";

export const metadata = { title: "Início" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function Biblioteca() {
  const user = await getCurrentUser();
  const [featured, recent, popular, categories, access, resume, wantList] = await Promise.all([
    featuredBooks(6),
    listBooks({ limit: 12 }),
    popularBooks(12),
    listCategories({ onlyWithBooks: true }),
    user ? hasAccess(user) : Promise.resolve(false),
    user ? continueListening(user.id) : Promise.resolve([]),
    user ? shelfBooks(user.id, "want") : Promise.resolve([]),
  ]);
  const byCategory = await Promise.all(categories.map(async (c) => ({ c, books: await booksInCategory(c.id, 12) })));

  return (
    <div>
      <HeroCarousel
        items={featured.map((b) => ({
          slug: b.slug,
          title: b.title,
          author: b.author,
          description: b.description,
          coverUrl: coverUrl(b),
          meta: [b.series_name && `${b.series_name}${b.series_position ? ` · Vol. ${b.series_position}` : ""}`, formatDuration(b.total_seconds)]
            .filter(Boolean)
            .join(" · "),
        }))}
      />

      <div className="container-page mb-10 mt-2 space-y-4">
        {user && <p className="text-sm text-muted">{greeting()}, {user.name.split(" ")[0]}.</p>}
        <SearchBox />
        <CategoryChips categories={categories} />
      </div>

      {!access && (
        <div className="container-page mb-12">
          <div className="glow relative overflow-hidden rounded-3xl border border-accent/20 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Assinatura</p>
            <p className="mt-2 max-w-lg font-serif text-2xl font-semibold sm:text-3xl">Todo o catálogo por {formatBRL(config.planPrice)} ao mês.</p>
            <p className="mt-2 text-sm text-muted">Pix ou cartão. Cancele quando quiser.</p>
            <Link href={user ? "/assinar" : "/cadastro"} className="btn-primary mt-5 !px-6 !py-3">Assinar agora</Link>
          </div>
        </div>
      )}

      {recent.length === 0 && <p className="container-page text-muted">Nenhum título publicado ainda.</p>}

      {resume.length > 0 && (
        <Row title="Continuar ouvindo">
          {resume.map((b) => <div key={b.id} className="shrink-0 snap-start"><ContinueCard book={b} /></div>)}
        </Row>
      )}
      <Shelf title="Quero ouvir" eyebrow="Sua lista" href="/estante?aba=quero" books={wantList} />
      <Shelf title="Novidades" eyebrow="Acabaram de chegar" books={recent} />
      <Shelf title="Mais ouvidos" eyebrow="Em alta" books={popular} />
      {byCategory.map(({ c, books }) => (
        <Shelf key={c.id} title={c.name} href={`/categoria/${c.slug}`} books={books} />
      ))}
    </div>
  );
}
