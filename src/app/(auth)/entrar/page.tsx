import { AuthForm } from "../AuthForm";

export const metadata = { title: "Entrar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-6 text-3xl font-semibold">Entrar</h1>
      <AuthForm mode="entrar" next={next} />
    </div>
  );
}
