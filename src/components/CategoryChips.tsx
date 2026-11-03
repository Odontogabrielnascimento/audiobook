import Link from "next/link";
import type { Category } from "@/lib/catalog";

export function CategoryChips({ categories, active }: { categories: Category[]; active?: string }) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Categorias" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categoria/${c.slug}`}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
            active === c.slug ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
