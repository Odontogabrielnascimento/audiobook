import { notFound } from "next/navigation";
import { BookGrid } from "@/components/BookCard";
import { CategoryChips } from "@/components/CategoryChips";
import { booksInCategory, getCategoryBySlug, listCategories } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await getCategoryBySlug((await params).slug);
  return { title: c?.name ?? "Categoria" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [books, categories] = await Promise.all([booksInCategory(category.id), listCategories({ onlyWithBooks: true })]);

  return (
    <div className="container-page space-y-6 py-6">
      <CategoryChips categories={categories} active={slug} />
      <h1 className="text-3xl font-semibold">{category.name}</h1>
      {books.length === 0 ? <p className="text-muted">Nenhum título nesta categoria ainda.</p> : <BookGrid books={books} />}
    </div>
  );
}
