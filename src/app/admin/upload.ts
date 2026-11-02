"use client";

// Envia um arquivo direto para o armazenamento usando a URL gerada pelo servidor
export async function uploadFile(kind: "audio" | "cover", file: File, onProgress?: (pct: number) => void) {
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
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Falha no envio (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Falha de rede no envio"));
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
