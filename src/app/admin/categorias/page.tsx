import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/catalog";
import { createCategory } from "../actions";
import { CategoryRow } from "./CategoryRow";

export const metadata = { title: "Categorias" };

export default async function Categorias() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <div className="container-page max-w-2xl py-8">
      <Link href="/admin" className="text-sm text-accent underline">← Painel</Link>
      <h1 className="mb-2 mt-4 text-3xl font-semibold">Categorias</h1>
      <p className="mb-6 text-muted">A ordem aqui é a ordem das prateleiras na página inicial. Categorias sem livros publicados não aparecem para o público.</p>

      <form action={createCategory} className="mb-6 flex gap-2">
        <input name="name" className="input" placeholder="Nova categoria (ex.: Vida cristã)" required maxLength={60} />
        <button className="btn-primary shrink-0">Adicionar</button>
      </form>

      {categories.length === 0 ? (
        <p className="text-muted">Nenhuma categoria ainda.</p>
      ) : (
        <ol className="card divide-y divide-line">
          {categories.map((c, i) => (
            <CategoryRow key={c.id} category={c} first={i === 0} last={i === categories.length - 1} />
          ))}
        </ol>
      )}
    </div>
  );
}
