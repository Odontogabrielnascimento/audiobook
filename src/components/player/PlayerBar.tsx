"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePlayer } from "./PlayerProvider";

const RATES = [0.8, 1, 1.25, 1.5, 1.75, 2];
const SLEEP = [15, 30, 60];

export function fmt(t: number) {
  const s = Math.max(0, Math.floor(t || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function PlayIcon({ playing, size = 20 }: { playing: boolean; size?: number }) {
  return playing ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
  );
}

function SkipIcon({ seconds, forward }: { seconds: number; forward?: boolean }) {
  return (
    <span className="relative grid h-12 w-12 place-items-center">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden
        style={forward ? undefined : { transform: "scaleX(-1)" }}>
        <path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v4h-4" />
      </svg>
      <span className="absolute text-[10px] font-bold">{seconds}</span>
    </span>
  );
}

function CoverArt({ url, className = "" }: { url: string | null; className?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`object-cover ${className}`} />
  ) : (
    <div className={`glow ${className}`} />
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);

  // Fecha a tela cheia com Esc e trava a rolagem da pagina por baixo
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  if (!p.queue) return null;
  const { book, chapters, index } = p.queue;
  const ch = chapters[index];
  const pct = p.duration ? Math.min(100, (p.current / p.duration) * 100) : 0;
  const sleepLeft = p.sleepAt ? Math.max(1, Math.ceil((p.sleepAt - Date.now()) / 60000)) : null;

  return (
    <>
      {/* Mini-player */}
      {!open && (
        <div className="fixed inset-x-2 bottom-[calc(4.4rem+env(safe-area-inset-bottom))] z-40 md:inset-x-auto md:bottom-5 md:right-5 md:w-[420px]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-2/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="flex items-center gap-3 p-2 pr-3">
              <button onClick={() => setOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Abrir player">
                <CoverArt url={book.coverUrl} className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ch.title}</p>
                  <p className="truncate text-xs text-muted">{book.title}</p>
                </div>
              </button>
              <button onClick={() => p.skip(-15)} className="hidden p-1 text-muted hover:text-ink sm:block" aria-label="Voltar 15 segundos">
                <SkipIcon seconds={15} />
              </button>
              <button onClick={p.toggle} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-paper" aria-label={p.playing ? "Pausar" : "Tocar"}>
                <PlayIcon playing={p.playing} />
              </button>
            </div>
            <div className="h-0.5 w-full bg-white/10">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {p.error && <p className="mt-1 rounded-xl bg-surface px-3 py-2 text-xs text-danger">{p.error}</p>}
        </div>
      )}

      {/* Player em tela cheia */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-paper" role="dialog" aria-modal="true" aria-label="Player">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <CoverArt url={book.coverUrl} className="h-full w-full scale-125 opacity-50 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/70 to-paper" />
          </div>

          <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Minimizar player">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Ouvindo agora</p>
              <button onClick={() => { setOpen(false); p.close(); }} className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Fechar player">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>

            <div className="mt-8 flex-1">
              <CoverArt url={book.coverUrl} className="mx-auto aspect-square w-full max-w-[340px] rounded-3xl shadow-2xl shadow-black/60" />
              <div className="mt-8">
                <p className="text-sm font-semibold text-accent">Faixa {index + 1} de {chapters.length}</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">{ch.title}</h2>
                <Link href={`/livro/${book.slug}`} onClick={() => setOpen(false)} className="mt-1 block text-muted hover:text-ink">
                  {book.title} · {book.author}
                </Link>
              </div>

              <div className="mt-6">
                <input type="range" min={0} max={p.duration || 0} step={1} value={Math.min(p.current, p.duration || 0)}
                  onChange={(e) => p.seek(Number(e.target.value))} className="w-full" aria-label="Posição na faixa" />
                <div className="flex justify-between text-xs tabular-nums text-muted">
                  <span>{fmt(p.current)}</span><span>−{fmt(p.duration - p.current)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button onClick={() => p.goTo(index - 1)} disabled={index === 0} className="p-2 disabled:opacity-30" aria-label="Faixa anterior">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 5h2v14H6zM20 6.2v11.6a1 1 0 0 1-1.5.86L9.6 13a1 1 0 0 1 0-1.72l8.9-5.66A1 1 0 0 1 20 6.2z" /></svg>
                </button>
                <button onClick={() => p.skip(-15)} aria-label="Voltar 15 segundos"><SkipIcon seconds={15} /></button>
                <button onClick={p.toggle} className="grid h-20 w-20 place-items-center rounded-full text-accent-ink shadow-[0_12px_40px_-10px_rgba(232,184,74,0.7)]"
                  style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent))" }} aria-label={p.playing ? "Pausar" : "Tocar"}>
                  <PlayIcon playing={p.playing} size={32} />
                </button>
                <button onClick={() => p.skip(30)} aria-label="Avançar 30 segundos"><SkipIcon seconds={30} forward /></button>
                <button onClick={() => p.goTo(index + 1)} disabled={index === chapters.length - 1} className="p-2 disabled:opacity-30" aria-label="Próxima faixa">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16 5h2v14h-2zM4 6.2v11.6a1 1 0 0 0 1.5.86l8.9-5.66a1 1 0 0 0 0-1.72L5.5 5.34A1 1 0 0 0 4 6.2z" /></svg>
                </button>
              </div>

              {p.error && <p className="mt-4 text-center text-sm text-danger">{p.error}</p>}

              <div className="mt-8 space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Velocidade</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {RATES.map((r) => (
                      <button key={r} onClick={() => p.setRate(r)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${p.rate === r ? "bg-ink text-paper" : "bg-white/10"}`}>
                        {String(r).replace(".", ",")}×
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Desligar em {sleepLeft && <span className="normal-case tracking-normal text-accent">· ativo, {sleepLeft} min</span>}
                  </p>
                  <div className="flex gap-2">
                    {SLEEP.map((m) => (
                      <button key={m} onClick={() => p.setSleep(m)} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold">{m} min</button>
                    ))}
                    {p.sleepAt && (
                      <button onClick={() => p.setSleep(null)} className="rounded-full px-3.5 py-1.5 text-sm text-muted underline">Cancelar</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
