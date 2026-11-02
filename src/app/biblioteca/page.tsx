import Link from "next/link";
import { BookCard } from "@/components/BookCard";
import { getCurrentUser, hasAccess } from "@/lib/auth";
import { continueListening, listBooks } from "@/lib/catalog";
import { config, formatBRL } from "@/lib/config";

export const metadata = { title: "Biblioteca" };

export default async function Biblioteca() {
  const user = await getCurrentUser();
  const [books, recent, access] = await Promise.all([
    listBooks(),
    user ? continueListening(user.id) : Promise.resolve([]),
    user ? hasAccess(user) : Promise.resolve(false),
  ]);

  return (
    <div className="container-page py-8">
      {!access && (
        <div className="card mb-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p>Assine para ouvir todos os títulos por {formatBRL(config.planPrice)}/mês.</p>
          <Link href={user ? "/assinar" : "/cadastro"} className="btn-primary shrink-0">Assinar</Link>
        </div>
      )}

      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-semibold">Continuar ouvindo</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:grid-cols-6">
            {recent.map((b) => <BookCard key={b.id} book={b} subtitle={b.chapter_title} />)}
          </div>
        </section>
      )}

      <h1 className="mb-4 text-2xl font-semibold">Catálogo</h1>
      {books.length === 0 ? (
        <p className="text-muted">Nenhum título publicado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:grid-cols-5">
          {books.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}
