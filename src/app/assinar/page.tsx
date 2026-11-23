import Link from "next/link";
import { requireUser, hasAccess } from "@/lib/auth";
import { isMock, simulationAllowed } from "@/lib/asaas";
import { config, formatBRL, formatDay } from "@/lib/config";
import { getAnnualOffer } from "@/lib/plans";
import { CheckoutForm } from "./CheckoutForm";
import { syncSubscriptionFromAsaas } from "@/lib/billing";

export const metadata = { title: "Assinar" };

export default async function Assinar() {
  const user = await requireUser("/assinar");
  await syncSubscriptionFromAsaas(user.id);
  if (await hasAccess(user)) {
    return (
      <div className="container-page max-w-md py-12">
        <h1 className="text-3xl font-semibold">Sua assinatura está ativa</h1>
        <p className="mt-3 text-muted">Bom proveito.</p>
        <Link href="/biblioteca" className="btn-primary mt-6">Ir para a biblioteca</Link>
      </div>
    );
  }
  const offer = await getAnnualOffer();
  return (
    <div className="container-page max-w-lg py-12">
      <h1 className="text-3xl font-semibold">Escolha seu plano</h1>
      <p className="mt-2 text-muted">Acesso a todo o catálogo nos dois planos. Cancele quando quiser em Minha conta.</p>
      {simulationAllowed && (
        <p className="mt-4 rounded-xl border border-warn p-3 text-sm text-warn">
          Modo simulado: nenhuma cobrança real será feita (ASAAS_API_KEY não configurada).
        </p>
      )}
      {isMock && !simulationAllowed && (
        <p className="mt-4 rounded-xl border border-warn p-3 text-sm text-warn">
          Pagamentos ainda não configurados.
        </p>
      )}
      <div className="mt-6">
        <CheckoutForm
          defaultCpf={user.cpf ?? ""}
          monthly={formatBRL(config.planPrice)}
          offer={offer.active ? {
            price: formatBRL(offer.price),
            perMonth: formatBRL(offer.perMonth),
            discountPct: offer.discountPct,
            until: offer.until ? formatDay(offer.until + "T00:00:00Z") : null,
            fullYear: formatBRL(config.planPrice * 12),
          } : null}
        />
      </div>
    </div>
  );
}
