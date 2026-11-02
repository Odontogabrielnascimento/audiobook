"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCover } from "../../actions";
import { uploadFile } from "../../upload";

export function CoverUploader({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setStatus("Enviando...");
      const key = await uploadFile("cover", file, (p) => setStatus(`Enviando ${p}%`));
      await setCover(bookId, key);
      setStatus(null);
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro no envio");
    }
  }

  return (
    <div>
      <label className="btn-ghost w-full cursor-pointer !px-3 !text-xs">
        Trocar capa
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <p className="mt-1 text-xs text-muted">{status ?? "Quadrada, mín. 1000×1000 px"}</p>
    </div>
  );
}
