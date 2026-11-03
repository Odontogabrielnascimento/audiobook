import { requireAdmin } from "@/lib/auth";
import { listCategories, listSeries } from "@/lib/catalog";
import { createBook } from "../../actions";
import { BookForm } from "../../BookForm";

export const metadata = { title: "Novo livro" };

export default async function NewBook() {
  await requireAdmin();
  const [categories, series] = await Promise.all([listCategories(), listSeries()]);
  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="mb-2 text-3xl font-semibold">Novo livro</h1>
      <p className="mb-6 text-muted">Depois de salvar você envia a capa e os arquivos de áudio.</p>
      <div className="card p-6"><BookForm action={createBook} submitLabel="Salvar e continuar" categories={categories} series={series} /></div>
    </div>
  );
}
