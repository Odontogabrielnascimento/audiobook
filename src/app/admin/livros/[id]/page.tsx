import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/BookCard";
import { ConfirmButton } from "@/components/ConfirmButton";
import { requireAdmin } from "@/lib/auth";
import { categoriesOfBook, getBookById, listCategories, listChapters, listSeries } from "@/lib/catalog";
import { deleteBook, togglePublished, updateBook } from "../../actions";
import { BookForm } from "../../BookForm";
import { ChapterManager } from "./ChapterManager";
import { CoverUploader } from "./CoverUploader";

export const metadata = { title: "Editar livro" };

export default async function EditBook({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const book = await getBookById(id);
  if (!book) notFound();
  const [chapters, categories, series, bookCategories] = await Promise.all([
    listChapters(id), listCategories(), listSeries(), categoriesOfBook(id),
  ]);

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin" className="text-sm text-accent underline">← Painel</Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/livro/${book.slug}`} className="btn-ghost">Ver página</Link>
          <form action={togglePublished.bind(null, id)}>
            <button className="btn-primary" disabled={!book.published && chapters.length === 0}>
              {book.published ? "Despublicar" : "Publicar"}
            </button>
          </form>
        </div>
      </div>
      {!book.published && chapters.length === 0 && (
        <p className="text-sm text-muted">Envie ao menos uma faixa de áudio para poder publicar.</p>
      )}

      <section className="card grid gap-6 p-6 sm:grid-cols-[160px_1fr]">
        <div className="space-y-3">
          <Cover book={book} />
          <CoverUploader bookId={id} />
        </div>
        <BookForm
          action={updateBook.bind(null, id)}
          book={book}
          submitLabel="Salvar dados"
          categories={categories}
          series={series}
          selectedCategories={bookCategories.map((c) => c.id)}
        />
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-xl font-semibold">Faixas de áudio</h2>
        <ChapterManager
          bookId={id}
          chapters={chapters.map((c) => ({ id: c.id, title: c.title, duration: c.duration_seconds }))}
        />
      </section>

      <form action={deleteBook.bind(null, id)} className="pt-4">
        <ConfirmButton className="btn-danger" message="Excluir este livro e todos os seus áudios? Isso não pode ser desfeito.">
          Excluir livro
        </ConfirmButton>
      </form>
    </div>
  );
}
