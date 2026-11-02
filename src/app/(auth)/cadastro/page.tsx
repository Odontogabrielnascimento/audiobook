import { AuthForm } from "../AuthForm";

export const metadata = { title: "Criar conta" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-2 text-3xl font-semibold">Criar conta</h1>
      <p className="mb-6 text-muted">Depois do cadastro você escolhe a forma de pagamento.</p>
      <AuthForm mode="cadastro" next={next} />
    </div>
  );
}
