"use client";

import { useTransition } from "react";
import { deleteCategory, moveCategory, renameCategory } from "../actions";

export function CategoryRow({ category, first, last }: {
  category: { id: string; name: string; book_count: number };
  first: boolean;
  last: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <li className={`flex items-center gap-2 p-2 ${pending ? "opacity-60" : ""}`}>
      <input
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 hover:border-line focus:border-accent focus:outline-none"
        defaultValue={category.name}
        aria-label="Nome da categoria"
        onBlur={(e) => e.target.value !== category.name && start(() => renameCategory(category.id, e.target.value))}
      />
      <span className="text-xs text-muted tabular-nums">{category.book_count} publ.</span>
      <button className="rounded p-1.5 hover:bg-paper disabled:opacity-30" disabled={first} onClick={() => start(() => moveCategory(category.id, -1))} aria-label="Subir">↑</button>
      <button className="rounded p-1.5 hover:bg-paper disabled:opacity-30" disabled={last} onClick={() => start(() => moveCategory(category.id, 1))} aria-label="Descer">↓</button>
      <button
        className="rounded p-1.5 text-danger hover:bg-paper"
        onClick={() => confirm(`Excluir a categoria "${category.name}"? Os livros continuam no catálogo.`) && start(() => deleteCategory(category.id))}
        aria-label="Excluir"
      >✕</button>
    </li>
  );
}
