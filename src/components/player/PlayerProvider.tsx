"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PlayerBar } from "./PlayerBar";

export type PlayerChapter = { id: string; title: string; duration: number };
export type PlayerBook = { id: string; slug: string; title: string; author: string; coverUrl: string | null };

type Queue = { book: PlayerBook; chapters: PlayerChapter[]; index: number };

type PlayerState = {
  queue: Queue | null;
  playing: boolean;
  current: number;
  duration: number;
  rate: number;
  sleepAt: number | null; // timestamp em ms
  error: string | null;
  play: (book: PlayerBook, chapters: PlayerChapter[], index: number, startAt?: number) => void;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  goTo: (index: number) => void;
  setRate: (r: number) => void;
  setSleep: (minutes: number | null) => void;
  close: () => void;
};

const Ctx = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer fora do PlayerProvider");
  return ctx;
}

const SAVE_EVERY_MS = 15_000;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [sleepAt, setSleepAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingStart = useRef(0);
  const lastSaved = useRef(0);
  const queueRef = useRef<Queue | null>(null);
  queueRef.current = queue;

  // Velocidade preferida fica salva no aparelho
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("player-rate"));
      if (saved >= 0.5 && saved <= 3) setRateState(saved);
    } catch {}
  }, []);

  const saveProgress = useCallback((force = false) => {
    const q = queueRef.current;
    const a = audioRef.current;
    if (!q || !a) return;
    const now = Date.now();
    if (!force && now - lastSaved.current < SAVE_EVERY_MS) return;
    lastSaved.current = now;
    const body = JSON.stringify({
      bookId: q.book.id,
      chapterId: q.chapters[q.index].id,
      position: Math.floor(a.currentTime),
    });
    if (force && navigator.sendBeacon) {
      navigator.sendBeacon("/api/progress", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  }, []);

  const load = useCallback((q: Queue, startAt: number, autoplay: boolean) => {
    const a = audioRef.current;
    if (!a) return;
    setError(null);
    pendingStart.current = startAt;
    a.src = `/api/audio/${q.chapters[q.index].id}`;
    a.playbackRate = rate;
    if (autoplay) a.play().catch(() => setPlaying(false));
  }, [rate]);

  const play = useCallback<PlayerState["play"]>((book, chapters, index, startAt = 0) => {
    const q = { book, chapters, index };
    const same = queueRef.current?.book.id === book.id && queueRef.current.index === index;
    if (same && audioRef.current?.src) {
      if (startAt) audioRef.current.currentTime = startAt;
      audioRef.current.play().catch(() => {});
      return;
    }
    saveProgress(true);
    setQueue(q);
    queueRef.current = q;
    setCurrent(startAt);
    setDuration(chapters[index].duration);
    load(q, startAt, true);
  }, [load, saveProgress]);

  const goTo = useCallback((index: number) => {
    const q = queueRef.current;
    if (!q || index < 0 || index >= q.chapters.length) return;
    play(q.book, q.chapters, index, 0);
  }, [play]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !queueRef.current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, a.duration || t));
    setCurrent(a.currentTime);
  }, []);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current;
    if (a) seek(a.currentTime + delta);
  }, [seek]);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
    try { localStorage.setItem("player-rate", String(r)); } catch {}
  }, []);

  const setSleep = useCallback((minutes: number | null) => {
    setSleepAt(minutes ? Date.now() + minutes * 60_000 : null);
  }, []);

  const close = useCallback(() => {
    saveProgress(true);
    const a = audioRef.current;
    if (a) { a.pause(); a.removeAttribute("src"); a.load(); }
    setQueue(null);
    setPlaying(false);
    setSleepAt(null);
  }, [saveProgress]);

  // Temporizador de desligamento
  useEffect(() => {
    if (!sleepAt) return;
    const id = setInterval(() => {
      if (Date.now() >= sleepAt) {
        audioRef.current?.pause();
        setSleepAt(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sleepAt]);

  // Controles na tela de bloqueio / fones de ouvido
  useEffect(() => {
    if (!queue || !("mediaSession" in navigator)) return;
    const ch = queue.chapters[queue.index];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: ch.title,
      artist: queue.book.author,
      album: queue.book.title,
      artwork: queue.book.coverUrl ? [{ src: queue.book.coverUrl, sizes: "512x512" }] : [],
    });
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", () => audioRef.current?.play());
    ms.setActionHandler("pause", () => audioRef.current?.pause());
    ms.setActionHandler("seekbackward", () => skip(-15));
    ms.setActionHandler("seekforward", () => skip(30));
    ms.setActionHandler("previoustrack", queue.index > 0 ? () => goTo(queue.index - 1) : null);
    ms.setActionHandler("nexttrack", queue.index < queue.chapters.length - 1 ? () => goTo(queue.index + 1) : null);
    try {
      ms.setActionHandler("seekto", (d) => { if (d.seekTime != null) seek(d.seekTime); });
    } catch {}
  }, [queue, skip, goTo, seek]);

  // Salva ao fechar/ocultar a aba
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") saveProgress(true); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [saveProgress]);

  const retried = useRef(false);

  return (
    <Ctx.Provider value={{ queue, playing, current, duration, rate, sleepAt, error, play, toggle, seek, skip, goTo, setRate, setSleep, close }}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (Number.isFinite(a.duration)) setDuration(a.duration);
          if (pendingStart.current) { a.currentTime = pendingStart.current; pendingStart.current = 0; }
          a.playbackRate = rate;
          retried.current = false;
        }}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); saveProgress(); }}
        onPlay={() => setPlaying(true)}
        onPause={() => { setPlaying(false); saveProgress(true); }}
        onEnded={() => {
          const q = queueRef.current;
          if (q && q.index < q.chapters.length - 1) goTo(q.index + 1);
          else setPlaying(false);
        }}
        onError={(e) => {
          const a = e.currentTarget;
          const q = queueRef.current;
          if (!q || !a.getAttribute("src")) return;
          // Link temporario expirado: recarrega uma vez no mesmo ponto
          if (!retried.current) {
            retried.current = true;
            load(q, a.currentTime || current, !a.paused || playing);
            return;
          }
          setPlaying(false);
          setError("Não foi possível tocar este capítulo. Verifique sua assinatura ou a conexão.");
        }}
      />
      <PlayerBar />
    </Ctx.Provider>
  );
}
