"use client";

import Link from "next/link";
import { usePlayer, type PlayerBook, type PlayerChapter } from "@/components/player/PlayerProvider";
import { fmt } from "@/components/player/PlayerBar";

type Props = {
  book: PlayerBook;
  chapters: PlayerChapter[];
  gate: "login" | "subscribe" | null;
  progress: { chapterId: string; position: number } | null;
};

export function ChapterList({ book, chapters, gate, progress }: Props) {
  const p = usePlayer();
  const resumeIndex = progress ? chapters.findIndex((c) => c.id === progress.chapterId) : -1;
  const activeIndex = p.queue?.book.id === book.id ? p.queue.index : -1;

  const cta =
    gate === "login" ? (
      <Link href={`/cadastro?next=/livro/${book.slug}`} className="btn-primary">Criar conta para ouvir</Link>
    ) : gate === "subscribe" ? (
      <Link href="/assinar" className="btn-primary">Assinar para ouvir</Link>
    ) : chapters.length === 0 ? null : resumeIndex >= 0 ? (
      <button className="btn-primary" onClick={() => p.play(book, chapters, resumeIndex, progress!.position)}>
        Continuar · {chapters[resumeIndex].title} ({fmt(progress!.position)})
      </button>
    ) : (
      <button className="btn-primary" onClick={() => p.play(book, chapters, 0)}>Começar a ouvir</button>
    );

  return (
    <section className="mt-8">
      <div className="mb-8 [&>*]:!px-7 [&>*]:!py-3.5 [&>*]:!text-base">{cta}</div>
      <h2 className="mb-4 text-2xl font-semibold">Faixas</h2>
      {chapters.length === 0 ? (
        <p className="text-muted">Nenhuma faixa enviada ainda.</p>
      ) : (
        <ol className="card divide-y divide-line overflow-hidden">
          {chapters.map((c, i) => {
            const active = i === activeIndex;
            return (
              <li key={c.id}>
                <button
                  disabled={!!gate}
                  onClick={() => (active ? p.toggle() : p.play(book, chapters, i, i === resumeIndex ? progress!.position : 0))}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  <span className={`w-6 text-right text-sm tabular-nums ${active ? "text-accent" : "text-muted"}`}>
                    {active && p.playing ? "▶" : i + 1}
                  </span>
                  <span className={`flex-1 ${active ? "font-semibold text-accent" : ""}`}>{c.title}</span>
                  <span className="text-sm tabular-nums text-muted">{fmt(c.duration)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
