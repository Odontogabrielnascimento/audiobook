import Link from "next/link";

// Mensagem exibida logo depois do cadastro (conta gratuita)
export function WelcomeNotice({ name, hasFreeBooks }: { name: string; hasFreeBooks: boolean }) {
  return (
    <div className="card border-accent/40 p-5">
      <p className="text-lg font-semibold">Bem-vindo, {name.split(" ")[0]}! Sua conta gratuita está pronta.</p>
      <p className="mt-1 text-sm text-muted">
        {hasFreeBooks
          ? "Você já pode ouvir os livros marcados como Grátis ou Amostra. Quando quiser o catálogo completo, é só assinar."
          : "Explore o catálogo. Quando quiser ouvir os livros completos, é só assinar."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {hasFreeBooks && <a href="#ouca-gratis" className="btn-primary">Ouvir os grátis</a>}
        <Link href="/assinar" className="btn-ghost">Ver planos</Link>
      </div>
    </div>
  );
}
