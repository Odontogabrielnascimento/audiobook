"use client";

// Limite por arquivo do armazenamento (Supabase gratuito: 50 MB). Ajuste com NEXT_PUBLIC_MAX_UPLOAD_MB.
export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "50");

export function sizeMB(file: File) {
  return file.size / (1024 * 1024);
}

export function tooBigMessage(file: File) {
  return `Arquivo de ${sizeMB(file).toFixed(0).replace(".", ",")} MB: o limite é ${MAX_UPLOAD_MB} MB por arquivo. ` +
    "Exporte em MP3 mono de 64 kbps (cerca de 28 MB por hora de áudio) ou divida em faixas menores.";
}

// Envia um arquivo direto para o armazenamento usando a URL gerada pelo servidor
export async function uploadFile(kind: "audio" | "cover", file: File, onProgress?: (pct: number) => void) {
  if (sizeMB(file) > MAX_UPLOAD_MB) throw new Error(tooBigMessage(file));
  const res = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, filename: file.name, contentType: file.type }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { key, url } = (await res.json()) as { key: string; url: string };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status < 300) return resolve();
      // Servicos S3 explicam a recusa em XML: <Code> e <Message>
      const body = xhr.responseText || "";
      const code = body.match(/<Code>([^<]*)<\/Code>/)?.[1];
      const msg = body.match(/<Message>([^<]*)<\/Message>/)?.[1] ?? body.slice(0, 200);
      reject(new Error(`Falha no envio (${xhr.status})${code ? ` ${code}` : ""}${msg ? `: ${msg}` : ""}`));
    };
    xhr.onerror = () =>
      reject(new Error(
        sizeMB(file) > MAX_UPLOAD_MB * 0.9
          ? tooBigMessage(file)
          : "A conexão caiu durante o envio. Verifique a internet e tente de novo.",
      ));
    xhr.send(file);
  });
  return key;
}

// Le a duracao do audio no proprio navegador
export function audioDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Number.isFinite(a.duration) ? a.duration : 0); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });
}
