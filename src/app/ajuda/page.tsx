import Link from "next/link";
import { Fill, Prose } from "@/components/Footer";
import { config, formatBRL } from "@/lib/config";

export const metadata = { title: "Ajuda" };

const price = formatBRL(config.planPrice);

const FAQ: [string, React.ReactNode][] = [
  ["Quanto custa?", <>A assinatura custa {price} por mês e dá acesso a todo o catálogo, sem limite de horas.</>],
  ["Como pago?", <>Por Pix ou cartão de crédito. No cartão, a cobrança se repete sozinha todo mês. No Pix, você recebe a cobrança do mês por e-mail e paga pelo aplicativo do banco.</>],
  ["Quando o acesso é liberado?", <>Assim que o pagamento é confirmado. No Pix costuma levar poucos minutos; no cartão, é quase imediato.</>],
  ["Como cancelo?", <>Em <Link href="/conta">Minha conta</Link>, toque em “Cancelar assinatura”. Você continua ouvindo até o fim do período já pago e não há novas cobranças.</>],
  ["Posso pedir reembolso?", <>Sim, em até 7 dias depois da contratação, como garante o Código de Defesa do Consumidor (art. 49). Escreva para o nosso contato abaixo.</>],
  ["Como instalo no celular?", <>No Android, abra o site no Chrome, toque no menu (⋮) e em “Adicionar à tela inicial”. No iPhone, abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</>],
  ["O app guarda onde eu parei?", <>Sim. A posição é salva automaticamente e vale em qualquer aparelho em que você entrar com a mesma conta.</>],
  ["Posso ouvir sem internet?", <>Ainda não. Por enquanto é preciso estar conectado.</>],
  ["Esqueci minha senha.", <>Na tela de entrar, toque em <Link href="/esqueci-senha">Esqueci minha senha</Link> e siga o link que enviaremos por e-mail.</>],
  ["Como excluo minha conta?", <>Em <Link href="/conta">Minha conta</Link>, no fim da página, toque em “Excluir minha conta”.</>],
];

export default function Ajuda() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-4xl font-semibold">Ajuda</h1>
      <div className="space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card group p-5 [&_a]:text-accent [&_a]:underline">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
              {q}
              <span className="text-accent transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-ink/80">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-10">
        <Prose>
          <h2>Fale com a gente</h2>
          <p>
            Escreva para{" "}
            {config.supportEmail ? <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a> : <Fill value="" label="e-mail de suporte" />}.
            Respondemos em dias úteis.
          </p>
        </Prose>
      </div>
    </div>
  );
}
