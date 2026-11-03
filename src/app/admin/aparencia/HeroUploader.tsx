"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setHeroImage } from "../actions";
import { uploadFile } from "../upload";

export function HeroUploader({ hasHero }: { hasHero: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    try {
      const key = await uploadFile("cover", file, (p) => setStatus(`Enviando ${p}%`));
      await setHeroImage(key);
      setStatus(null);
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro no envio");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="btn-primary cursor-pointer">
        {hasHero ? "Trocar banner" : "Enviar banner"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {hasHero && (
        <button className="btn-ghost" onClick={async () => { await setHeroImage(null); router.refresh(); }}>Remover</button>
      )}
      {status && <span className="text-sm text-muted">{status}</span>}
    </div>
  );
}
