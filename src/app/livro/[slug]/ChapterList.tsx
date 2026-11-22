"use client";

import Link from "next/link";
import { usePlayer, type PlayerBook, type PlayerChapter } from "@/components/player/PlayerProvider";
import { fmt } from "@/components/player/PlayerBar";

type Access = "subscribers" | "sample" | "free";

type Props = {
  book: PlayerBook;
  chapters: PlayerChapter[];
  access: Access;
  loggedIn: boolean;
  subscribed: boolean;
  progress: { chapterId: string; position: number } | null;
};

const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-label="Exclusivo para assinantes">
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export function ChapterList({ book, chapters, access, loggedIn, subscribed, progress }: Props) {
  const p = usePlayer();
  const isFree = (i: number) => access === "free" || (access === "sample" && i === 0);
  const unlocked = (i: number) => subscribed || (loggedIn && isFree(i));
  // Faixas liberadas formam sempre um bloco inicial (amostra: so a primeira)
  const playable = chapters.filter((_, i) => unlocked(i));
  const partial = playable.length < chapters.length;
  const playerBook = { ...book, partial };

  const resumeIndex = progress ? playable.findIndex((c) => c.id === progress.chapterId) : -1;
  const activeIndex = p.queue?.book.id === book.id ? p.queue.index : -1;
  const signupHref = `/cadastro?next=/livro/${book.slug}`;
  const play = (i: number, at = 0) => p.play(playerBook, playable, i, at);

  let cta: React.ReactNode = null;
  if (chapters.length === 0) cta = null;
  else if (!loggedIn) {
    cta = (
      <Link href={signupHref} className="btn-primary">
        {access === "free" ? "Criar conta grátis e ouvir" : access === "sample" ? "Criar conta grátis e ouvir a amostra" : "Criar conta para ouvir"}
      </Link>
    );
  } else if (playable.length === 0) {
    cta = <Link href="/assinar" className="btn-primary">Assinar para ouvir</Link>;
  } else if (resumeIndex >= 0) {
    cta = (
      <button className="btn-primary" onClick={() => play(resumeIndex, progress!.position)}>
        Continuar · {playable[resumeIndex].title} ({fmt(progress!.position)})
      </button>
    );
  } else {
    cta = (
      <button className="btn-primary" onClick={() => play(0)}>
        {partial ? "Ouvir amostra grátis" : access === "free" && !subscribed ? "Ouvir grátis" : "Começar a ouvir"}
      </button>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="[&>*]:!px-7 [&>*]:!py-3.5 [&>*]:!text-base">{cta}</div>
        {loggedIn && partial && playable.length > 0 && (
          <Link href="/assinar" className="btn-ghost !px-6 !py-3.5">Assinar para ouvir completo</Link>
        )}
      </div>
      {!subscribed && access !== "subscribers" && (
        <p className="-mt-4 mb-8 text-sm text-muted">
          {access === "free"
            ? "Este livro é gratuito: basta ter uma conta."
            : "A primeira faixa é gratuita. As demais são exclusivas para assinantes."}
        </p>
      )}

      <h2 className="mb-4 text-2xl font-semibold">Faixas</h2>
      {chapters.length === 0 ? (
        <p className="text-muted">Nenhuma faixa enviada ainda.</p>
      ) : (
        <ol className="card divide-y divide-line overflow-hidden">
          {chapters.map((c, i) => {
            const open = unlocked(i);
            const active = open && i === activeIndex;
            const content = (
              <>
                <span className={`w-6 text-right text-sm tabular-nums ${active ? "text-accent" : "text-muted"}`}>
                  {active && p.playing ? "▶" : i + 1}
                </span>
                <span className={`flex-1 ${active ? "font-semibold text-accent" : open ? "" : "text-ink/60"}`}>
                  {c.title}
                  {!subscribed && isFree(i) && access === "sample" && (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 align-middle text-[11px] font-semibold text-accent">Grátis</span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-sm tabular-nums text-muted">
                  {!open && <Lock />}
                  {fmt(c.duration)}
                </span>
              </>
            );
            const cls = "flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2";
            return (
              <li key={c.id}>
                {open ? (
                  <button className={cls} onClick={() => (active ? p.toggle() : play(i, i === resumeIndex ? progress!.position : 0))}>
                    {content}
                  </button>
                ) : (
                  <Link href={loggedIn ? "/assinar" : signupHref} className={cls}>{content}</Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
