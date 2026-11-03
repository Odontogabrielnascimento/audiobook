import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { heroImageUrl } from "@/lib/settings";
import { HeroUploader } from "./HeroUploader";

export const metadata = { title: "Aparência" };

export default async function Aparencia() {
  await requireAdmin();
  const hero = await heroImageUrl();
  return (
    <div className="container-page max-w-3xl py-8">
      <Link href="/admin" className="text-sm text-accent underline">← Painel</Link>
      <h1 className="mb-2 mt-4 text-3xl font-semibold">Aparência</h1>
      <p className="mb-6 text-muted">
        Banner da página de apresentação (para quem ainda não assinou). Use uma arte horizontal (16:9, mínimo 1920×1080),
        sem texto: o título e o botão são escritos por cima pelo app.
      </p>
      <div className="card overflow-hidden">
        <div className="glow relative aspect-video w-full">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="Banner atual" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {!hero && <p className="absolute inset-0 grid place-items-center text-sm text-muted">Sem banner: usando o fundo padrão</p>}
        </div>
        <div className="p-4"><HeroUploader hasHero={!!hero} /></div>
      </div>
    </div>
  );
}
