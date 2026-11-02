"use client";

import Link from "next/link";
import { useState } from "react";
import { usePlayer } from "./PlayerProvider";

const RATES = [0.8, 1, 1.25, 1.5, 1.75, 2];

export function fmt(t: number) {
  const s = Math.max(0, Math.floor(t || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function PlayerBar() {
  const p = usePlayer();
  const [open, setOpen] = useState(false);
  if (!p.queue) return null;
  const { book, chapters, index } = p.queue;
  const ch = chapters[index];
  const pct = p.duration ? (p.current / p.duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="h-1 w-full bg-line">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <div className="container-page py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-lg bg-accent-soft" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{ch.title}</p>
              <p className="truncate text-xs text-muted">{book.title}</p>
            </div>
          </button>
          <button onClick={() => p.skip(-15)} className="hidden rounded-full p-2 text-xs font-semibold hover:bg-paper sm:block" aria-label="Voltar 15 segundos">
            −15s
          </button>
          <button onClick={p.toggle} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink" aria-label={p.playing ? "Pausar" : "Tocar"}>
            {p.playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
            )}
          </button>
          <button onClick={() => p.skip(30)} className="hidden rounded-full p-2 text-xs font-semibold hover:bg-paper sm:block" aria-label="Avançar 30 segundos">
            +30s
          </button>
        </div>

        {p.error && <p className="mt-2 text-sm text-danger">{p.error}</p>}

        {open && (
          <div className="mt-4 space-y-4">
            <div>
              <input
                type="range"
                min={0}
                max={p.duration || 0}
                step={1}
                value={Math.min(p.current, p.duration || 0)}
                onChange={(e) => p.seek(Number(e.target.value))}
                className="w-full"
                aria-label="Posição no capítulo"
              />
              <div className="flex justify-between text-xs text-muted tabular-nums">
                <span>{fmt(p.current)}</span>
                <span>−{fmt(p.duration - p.current)}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button className="btn-ghost !px-3" disabled={index === 0} onClick={() => p.goTo(index - 1)}>Anterior</button>
              <button className="btn-ghost !px-3" onClick={() => p.skip(-15)}>−15s</button>
              <button className="btn-ghost !px-3" onClick={() => p.skip(30)}>+30s</button>
              <button className="btn-ghost !px-3" disabled={index === chapters.length - 1} onClick={() => p.goTo(index + 1)}>Próximo</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2">
                Velocidade
                <select className="rounded-lg border border-line bg-paper px-2 py-1" value={p.rate} onChange={(e) => p.setRate(Number(e.target.value))}>
                  {RATES.map((r) => <option key={r} value={r}>{r}×</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Desligar em
                <select
                  className="rounded-lg border border-line bg-paper px-2 py-1"
                  value={p.sleepAt ? "on" : ""}
                  onChange={(e) => p.setSleep(e.target.value && e.target.value !== "on" ? Number(e.target.value) : null)}
                >
                  <option value="">Desligado</option>
                  {p.sleepAt && <option value="on">Ativo ({Math.max(1, Math.ceil((p.sleepAt - Date.now()) / 60000))} min)</option>}
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                </select>
              </label>
              <div className="flex gap-2">
                <Link href={`/livro/${book.slug}`} className="btn-ghost !px-3 !py-1.5" onClick={() => setOpen(false)}>Ver livro</Link>
                <button className="btn-ghost !px-3 !py-1.5" onClick={p.close}>Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
