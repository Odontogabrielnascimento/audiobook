import Link from "next/link";
import { requireUser, hasAccess } from "@/lib/auth";
import { isMock } from "@/lib/asaas";
import { config, formatBRL } from "@/lib/config";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Assinar" };

export default async function Assinar() {
  const user = await requireUser("/assinar");
  if (await hasAccess(user)) {
    return (
      <div className="container-page max-w-md py-12">
        <h1 className="text-3xl font-semibold">Sua assinatura está ativa</h1>
        <p className="mt-3 text-muted">Bom proveito.</p>
        <Link href="/biblioteca" className="btn-primary mt-6">Ir para a biblioteca</Link>
      </div>
    );
  }
  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-3xl font-semibold">Assinatura mensal</h1>
      <p className="mt-2 text-muted">
        {formatBRL(config.planPrice)} por mês, acesso a todo o catálogo. Cancele quando quiser em Minha conta.
      </p>
      {isMock && (
        <p className="mt-4 rounded-xl border border-warn p-3 text-sm text-warn">
          Modo simulado: nenhuma cobrança real será feita (ASAAS_API_KEY não configurada).
        </p>
      )}
      <div className="mt-6">
        <CheckoutForm defaultCpf={user.cpf ?? ""} price={formatBRL(config.planPrice)} />
      </div>
    </div>
  );
}
