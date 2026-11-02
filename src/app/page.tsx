import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { listBooks } from "@/lib/catalog";
import { config, formatBRL } from "@/lib/config";

export default async function Home() {
  const [user, books] = await Promise.all([getCurrentUser(), listBooks()]);
  const access = user ? await hasAccess(user) : false;

  return (
    <>
      <section className="container-page grid gap-10 py-14 sm:py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Livros para ouvir, no seu tempo.
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted">
            Acesso a todo o catálogo de audiobooks por {formatBRL(config.planPrice)} por mês.
            Ouça no celular ou no computador e continue de onde parou.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {access ? (
              <Link href="/biblioteca" className="btn-primary">Ir para a biblioteca</Link>
            ) : (
              <Link href={user ? "/assinar" : "/cadastro"} className="btn-primary">
                Assinar por {formatBRL(config.planPrice)}/mês
              </Link>
            )}
            <Link href="/biblioteca" className="btn-ghost">Ver catálogo</Link>
          </div>
          <p className="mt-4 text-sm text-muted">Pagamento por Pix ou cartão de crédito. Cancele quando quiser.</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">O que está incluído</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>Todo o catálogo, sem limite de horas</li>
            <li>Marcação automática de onde você parou</li>
            <li>Velocidade de 0,8× a 2× e temporizador para dormir</li>
            <li>Controles na tela de bloqueio do celular</li>
            <li>Instale como aplicativo na tela inicial</li>
          </ul>
        </div>
      </section>

      {books.length > 0 && (
        <section className="container-page pb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">No catálogo</h2>
            <Link href="/biblioteca" className="text-sm text-accent underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:grid-cols-5">
            {books.slice(0, 10).map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}
    </>
  );
}
