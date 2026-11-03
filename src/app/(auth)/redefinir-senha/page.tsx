import Link from "next/link";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata = { title: "Nova senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="mb-6 text-3xl font-semibold">Criar nova senha</h1>
      {token ? (
        <NewPasswordForm token={token} />
      ) : (
        <p className="text-muted">Link inválido. <Link href="/esqueci-senha" className="text-accent underline">Peça um novo</Link>.</p>
      )}
    </div>
  );
}
