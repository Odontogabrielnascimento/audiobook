import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-md py-16 text-center">
      <h1 className="text-3xl font-semibold">Página não encontrada</h1>
      <Link href="/biblioteca" className="btn-primary mt-6">Ir para a biblioteca</Link>
    </div>
  );
}
