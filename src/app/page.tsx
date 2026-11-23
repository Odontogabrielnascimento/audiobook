import Link from "next/link";
import { redirect } from "next/navigation";
import { BookCard } from "@/components/BookCard";
import { getCurrentUser } from "@/lib/auth";
import { listBooks } from "@/lib/catalog";
import { config, formatBRL } from "@/lib/config";
import { heroImageUrl } from "@/lib/settings";
import { OfferBanner } from "@/components/OfferBanner";

const FEATURES = [
  ["Todo o catálogo", "Ouça quantos livros quiser, sem limite de horas."],
  ["Continue de onde parou", "A marcação é salva sozinha, em qualquer aparelho."],
  ["Feito para o seu ritmo", "Velocidade de 0,8× a 2× e temporizador para dormir."],
  ["No bolso", "Instale na tela inicial e controle pela tela de bloqueio."],
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/biblioteca");
  const [books, hero] = await Promise.all([listBooks({ limit: 12 }), heroImageUrl()]);

  return (
    <>
      <section className="relative -mt-16 overflow-hidden pt-16">
        <div className="absolute inset-0 glow" aria-hidden />
        {/* Banner enviado no Admin ou, sem ele, a arte padrao da marca */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero ?? "/brand/hero.svg"} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-40 md:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/40 to-paper" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-paper/95 via-paper/50 to-transparent md:via-paper/30" aria-hidden />

        <div className="container-page relative flex min-h-[78vh] flex-col justify-center py-20">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            ✦ Audiolivros cristãos
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
            A Palavra que <span className="bg-gradient-to-r from-accent to-flame bg-clip-text text-transparent">acompanha</span> o seu dia.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink/80">
            Livros de fé, teologia e vida cristã narrados para ouvir no caminho, em casa ou antes de dormir.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/cadastro?next=/assinar" className="btn-primary !px-7 !py-3.5 !text-base">Assinar a partir de {formatBRL(config.planPrice)}/mês</Link>
            <Link href="/cadastro" className="btn-ghost !px-6 !py-3.5 !text-base">Criar conta grátis</Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            A conta é gratuita e já dá acesso aos livros liberados. Assine quando quiser, por Pix ou cartão.{" "}
            <Link href="/biblioteca" className="underline hover:text-ink">Ver o catálogo</Link>
          </p>
          <div className="mt-8 max-w-xl"><OfferBanner href="/cadastro?next=/assinar" compact /></div>

        </div>
      </section>

      {books.length > 0 && (
        <section className="container-page py-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">No catálogo</p>
          <h2 className="mb-6 text-3xl font-semibold">Comece por aqui</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 lg:grid-cols-6">
            {books.slice(0, 12).map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      <section className="container-page grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(([t, d]) => (
          <div key={t} className="card p-6">
            <p className="font-serif text-lg font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
