import "server-only";
import { query, queryOne } from "./db";

// Configuracoes simples do site (ex.: banner da pagina inicial)
export async function getSetting(key: string) {
  const row = await queryOne<{ value: string }>("select value from site_settings where key = $1", [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null) {
  if (value === null) {
    await query("delete from site_settings where key = $1", [key]);
    return;
  }
  await query(
    `insert into site_settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, value],
  );
}

export async function heroImageUrl() {
  const key = await getSetting("hero_key");
  return key ? `/api/site/hero?v=${encodeURIComponent(key.split("/")[1])}` : null;
}
