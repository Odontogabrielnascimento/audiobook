import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover, Stars } from "@/components/BookCard";
import { booksInSeries, getSeriesBySlug } from "@/lib/catalog";
import { formatDuration } from "@/lib/config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getSeriesBySlug((await params).slug);
  return { title: s?.name ?? "Série" };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const series = await getSeriesBySlug((await params).slug);
  if (!series) notFound();
  const books = await booksInSeries(series.id);
  if (books.length === 0) notFound();

  return (
    <div className="container-page max-w-3xl py-6">
      <p className="text-sm text-muted">Série</p>
      <h1 className="mb-6 text-3xl font-semibold">{series.name}</h1>
      <ol className="space-y-3">
        {books.map((b, i) => (
          <li key={b.id}>
            <Link href={`/livro/${b.slug}`} className="card flex items-center gap-4 p-3 hover:border-accent">
              <div className="w-20 shrink-0"><Cover book={b} /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">Volume {b.series_position ?? i + 1}</p>
                <p className="font-semibold leading-snug">{b.title}</p>
                <p className="text-sm text-muted">{b.author} · {formatDuration(b.total_seconds)}</p>
                <Stars value={b.rating_avg} count={b.rating_count} />
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
