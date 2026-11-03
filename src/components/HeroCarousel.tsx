"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroItem = {
  slug: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string | null;
  meta: string;
};

// Carrossel de destaques com a capa desfocada ao fundo
export function HeroCarousel({ items }: { items: HeroItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 7000);
    return () => clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const it = items[i];

  return (
    <section className="relative overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel" aria-label="Destaques">
      {/* Fundos: um por item, com transicao suave */}
      {items.map((x, k) => (
        <div key={x.slug} aria-hidden className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? "opacity-100" : "opacity-0"}`}>
          {x.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={x.coverUrl} alt="" className="h-full w-full scale-125 object-cover opacity-60 blur-3xl" />
          ) : (
            <div className="glow h-full w-full" />
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/20 via-paper/50 to-paper" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-paper/80 via-paper/20 to-transparent" aria-hidden />

      <div className="container-page relative grid items-center gap-8 pb-12 pt-8 md:grid-cols-[1fr_340px] md:pb-16 md:pt-14">
        <div key={it.slug} className="order-2 animate-[fadeUp_.6s_ease] md:order-1">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            ✦ Em destaque
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">{it.title}</h1>
          <p className="mt-3 text-lg text-ink/80">{it.author}</p>
          <p className="mt-1 text-sm text-muted">{it.meta}</p>
          {it.description && <p className="mt-4 line-clamp-3 max-w-xl text-ink/75">{it.description}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/livro/${it.slug}`} className="btn-primary !px-6 !py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
              Ouvir agora
            </Link>
          </div>
        </div>

        <Link href={`/livro/${it.slug}`} className="order-1 mx-auto w-52 sm:w-64 md:order-2 md:w-full" tabIndex={-1}>
          {it.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={it.slug} src={it.coverUrl} alt={`Capa de ${it.title}`}
              className="aspect-square w-full animate-[fadeUp_.6s_ease] rounded-3xl object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10" />
          ) : (
            <div className="glow aspect-square w-full rounded-3xl ring-1 ring-white/10" />
          )}
        </Link>
      </div>

      {items.length > 1 && (
        <div className="relative -mt-6 mb-6 flex justify-center gap-2">
          {items.map((x, k) => (
            <button key={x.slug} onClick={() => setI(k)} aria-label={`Destaque ${k + 1}: ${x.title}`} aria-current={k === i}
              className={`h-1.5 rounded-full transition-all ${k === i ? "w-8 bg-accent" : "w-3 bg-white/25 hover:bg-white/40"}`} />
          ))}
        </div>
      )}
    </section>
  );
}
