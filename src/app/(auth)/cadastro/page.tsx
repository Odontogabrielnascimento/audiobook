import { AuthForm } from "../AuthForm";

export const metadata = { title: "Criar conta" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-2 text-3xl font-semibold">Criar conta grátis</h1>
      <p className="mb-6 text-muted">
        {next === "/assinar"
          ? "Crie sua conta e, em seguida, escolha o seu plano."
          : "A conta é gratuita e dá acesso aos livros liberados. Assinar é opcional e pode ser feito depois."}
      </p>
      <AuthForm mode="cadastro" next={next} />
    </div>
  );
}
