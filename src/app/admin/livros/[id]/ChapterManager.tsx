"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fmt } from "@/components/player/PlayerBar";
import { addChapter, deleteChapter, moveChapter, renameChapter } from "../../actions";
import { audioDuration, uploadFile } from "../../upload";

type Ch = { id: string; title: string; duration: number };
type Job = { name: string; pct: number; error?: string };

// Ordena "Capitulo 2" antes de "Capitulo 10"
const natural = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function titleFromFile(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
}

export function ChapterManager({ bookId, chapters }: { bookId: string; chapters: Ch[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const files = [...list].sort((a, b) => natural.compare(a.name, b.name));
    setBusy(true);
    setJobs(files.map((f) => ({ name: f.name, pct: 0 })));
    // Envia em sequencia para manter a ordem das faixas
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const update = (patch: Partial<Job>) => setJobs((js) => js.map((j, k) => (k === i ? { ...j, ...patch } : j)));
      try {
        const duration = await audioDuration(f);
        const key = await uploadFile("audio", f, (pct) => update({ pct }));
        await addChapter(bookId, { title: titleFromFile(f.name), key, duration });
        update({ pct: 100 });
      } catch (e) {
        update({ error: e instanceof Error ? e.message : "Erro" });
      }
    }
    setBusy(false);
    setJobs((js) => js.filter((j) => j.error));
    router.refresh();
  }

  const act = (fn: () => Promise<unknown>) => startTransition(async () => { await fn(); router.refresh(); });

  return (
    <div className="space-y-4">
      {chapters.length > 0 && (
        <ol className={`divide-y divide-line rounded-xl border border-line ${pending ? "opacity-60" : ""}`}>
          {chapters.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 p-2">
              <span className="w-6 text-right text-sm text-muted tabular-nums">{i + 1}</span>
              <input
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 hover:border-line focus:border-accent focus:outline-none"
                defaultValue={c.title}
                aria-label={`Título da faixa ${i + 1}`}
                onBlur={(e) => e.target.value !== c.title && act(() => renameChapter(c.id, e.target.value))}
              />
              <span className="hidden text-sm text-muted tabular-nums sm:inline">{fmt(c.duration)}</span>
              <button className="rounded p-1.5 hover:bg-paper disabled:opacity-30" disabled={i === 0} onClick={() => act(() => moveChapter(c.id, -1))} aria-label="Subir">↑</button>
              <button className="rounded p-1.5 hover:bg-paper disabled:opacity-30" disabled={i === chapters.length - 1} onClick={() => act(() => moveChapter(c.id, 1))} aria-label="Descer">↓</button>
              <button
                className="rounded p-1.5 text-danger hover:bg-paper"
                onClick={() => confirm(`Excluir "${c.title}"?`) && act(() => deleteChapter(c.id))}
                aria-label="Excluir"
              >✕</button>
            </li>
          ))}
        </ol>
      )}

      {jobs.length > 0 && (
        <ul className="space-y-1 text-sm">
          {jobs.map((j) => (
            <li key={j.name} className={j.error ? "text-danger" : "text-muted"}>
              {j.name}: {j.error ?? `${j.pct}%`}
            </li>
          ))}
        </ul>
      )}

      <label className={`btn-ghost cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
        {busy ? "Enviando..." : "Adicionar arquivos de áudio"}
        <input type="file" accept="audio/*,.m4b" multiple className="sr-only" disabled={busy} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </label>
      <p className="text-xs text-muted">
        MP3 ou M4A. Selecione vários de uma vez: entram em ordem pelo nome do arquivo e o título vem do nome (dá para editar depois).
      </p>
    </div>
  );
}
