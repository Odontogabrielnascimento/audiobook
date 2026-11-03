"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { BookFormState } from "./actions";

type Book = {
  title: string;
  author: string;
  narrator: string | null;
  description: string;
  series_id?: string | null;
  series_position?: number | null;
  featured?: boolean;
};
type Option = { id: string; name: string };

export function BookForm({ action, book, submitLabel, categories, series, selectedCategories = [] }: {
  action: (s: BookFormState, f: FormData) => Promise<BookFormState>;
  book?: Book;
  submitLabel: string;
  categories: Option[];
  series: Option[];
  selectedCategories?: string[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [seriesChoice, setSeriesChoice] = useState(book?.series_id ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="title">Título</label>
        <input className="input" id="title" name="title" defaultValue={book?.title} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="author">Autor</label>
          <input className="input" id="author" name="author" defaultValue={book?.author} required />
        </div>
        <div>
          <label className="label" htmlFor="narrator">Narração</label>
          <input className="input" id="narrator" name="narrator" defaultValue={book?.narrator ?? ""} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Sinopse</label>
        <textarea className="input min-h-32" id="description" name="description" defaultValue={book?.description} />
      </div>

      <fieldset>
        <legend className="label">Categorias</legend>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma categoria criada. <Link href="/admin/categorias" className="text-accent underline">Criar categorias</Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                <input type="checkbox" name="categories" value={c.id} defaultChecked={selectedCategories.includes(c.id)} className="accent-[var(--accent)]" />
                {c.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="label" htmlFor="series_id">Série</label>
          <select id="series_id" name="series_id" className="input" value={seriesChoice} onChange={(e) => setSeriesChoice(e.target.value)}>
            <option value="">Não faz parte de série</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="new">+ Nova série…</option>
          </select>
          {seriesChoice === "new" && (
            <input className="input mt-2" name="series_new" placeholder="Nome da nova série" required />
          )}
        </div>
        {seriesChoice && (
          <div>
            <label className="label" htmlFor="series_position">Volume</label>
            <input className="input" id="series_position" name="series_position" type="number" min={1} defaultValue={book?.series_position ?? ""} />
          </div>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-3 has-[:checked]:border-accent">
        <input type="checkbox" name="featured" defaultChecked={book?.featured} className="h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block text-sm font-semibold">Destaque na página inicial</span>
          <span className="block text-xs text-muted">Aparece no carrossel do topo. Sem nenhum marcado, entram os mais recentes com capa.</span>
        </span>
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-accent">Salvo.</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Salvando..." : submitLabel}</button>
    </form>
  );
}
