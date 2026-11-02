"use client";

import { useActionState } from "react";
import type { BookFormState } from "./actions";

type Book = { title: string; author: string; narrator: string | null; description: string };

export function BookForm({ action, book, submitLabel }: {
  action: (s: BookFormState, f: FormData) => Promise<BookFormState>;
  book?: Book;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
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
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="text-sm text-accent">Salvo.</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Salvando..." : submitLabel}</button>
    </form>
  );
}
