"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { rateBook, setShelf } from "./actions";

type Props = {
  bookId: string;
  loggedIn: boolean;
  canRate: boolean;
  shelf: "want" | "finished" | null;
  myRating: number | null;
};

export function BookActions({ bookId, loggedIn, canRate, shelf, myRating }: Props) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useOptimistic(shelf);
  const [rating, setRating] = useOptimistic(myRating);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!loggedIn) {
    return <p className="text-sm text-muted"><Link href="/entrar" className="text-accent underline">Entre</Link> para guardar na estante e avaliar.</p>;
  }

  const toggle = (next: "want" | "finished") =>
    start(async () => {
      const value = status === next ? null : next;
      setStatus(value);
      const r = await setShelf(bookId, value);
      setError(r.error ?? null);
    });

  const rate = (n: number) =>
    start(async () => {
      setRating(n);
      const r = await rateBook(bookId, n);
      setError(r.error ?? null);
    });

  const shown = hover || rating || 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggle("want")}
          disabled={pending}
          aria-pressed={status === "want"}
          className={status === "want" ? "btn !bg-accent-soft !text-accent border border-accent" : "btn-ghost"}
        >
          {status === "want" ? "✓ Na lista" : "+ Quero ouvir"}
        </button>
        <button
          onClick={() => toggle("finished")}
          disabled={pending}
          aria-pressed={status === "finished"}
          className={status === "finished" ? "btn !bg-accent-soft !text-accent border border-accent" : "btn-ghost"}
        >
          {status === "finished" ? "✓ Concluído" : "Marcar como concluído"}
        </button>
      </div>

      {canRate && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Sua nota:</span>
          <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Sua avaliação">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => rate(n)}
                disabled={pending}
                className="p-0.5"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" className={n <= shown ? "text-warn" : "text-line"} fill="currentColor" aria-hidden>
                  <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
