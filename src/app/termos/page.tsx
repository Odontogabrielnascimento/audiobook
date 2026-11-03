import Link from "next/link";
import { DraftNotice, Fill, Prose } from "@/components/Footer";
import { config, formatBRL } from "@/lib/config";

export const metadata = { title: "Termos de uso" };

export default function Termos() {
  const empresa = <Fill value={config.legalName} label="razão social" />;
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-2 text-4xl font-semibold">Termos de uso</h1>
      <p className="mb-6 text-sm text-muted">Última atualização: <Fill value="" label="data da publicação" /></p>
      <DraftNotice />
      <div className="mt-8">
        <Prose>
          <h2>1. Quem somos</h2>
          <p>
            O {config.appName} é um serviço de audiolivros por assinatura oferecido por {empresa}, inscrita no CNPJ sob o nº{" "}
            <Fill value={config.legalId} label="CNPJ" />, com sede em <Fill value="" label="endereço" />. Ao criar uma conta, você
            concorda com estes Termos e com a <Link href="/privacidade">Política de privacidade</Link>.
          </p>

          <h2>2. Conta</h2>
          <ul>
            <li>Para usar o serviço é preciso ter 18 anos ou mais, ou autorização do responsável legal.</li>
            <li>Você é responsável por manter sua senha em sigilo e pelas atividades feitas na sua conta.</li>
            <li>A conta é pessoal. Não é permitido compartilhar o acesso com terceiros.</li>
          </ul>

          <h2>3. Assinatura e pagamento</h2>
          <ul>
            <li>A assinatura custa {formatBRL(config.planPrice)} por mês e dá acesso a todo o catálogo disponível durante o período pago.</li>
            <li>O pagamento é feito por Pix ou cartão de crédito, processado pela Asaas Gestão Financeira Instituição de Pagamento S.A. Não armazenamos dados do seu cartão.</li>
            <li>A assinatura se renova automaticamente a cada mês até ser cancelada. No cartão, a cobrança é automática; no Pix, enviamos a cobrança do mês por e-mail.</li>
            <li>Se o pagamento não for confirmado em até {config.graceDays} dias após o vencimento, o acesso é suspenso até a regularização.</li>
            <li>Alterações de preço serão comunicadas com antecedência mínima de 30 dias e valerão a partir da renovação seguinte.</li>
          </ul>

          <h2>4. Cancelamento e reembolso</h2>
          <ul>
            <li>Você pode cancelar a qualquer momento em “Minha conta”. O acesso continua até o fim do período já pago e não há novas cobranças.</li>
            <li>
              Direito de arrependimento: em até 7 dias da primeira contratação, você pode desistir e receber o valor pago de volta,
              conforme o art. 49 do Código de Defesa do Consumidor. Para isso, escreva para{" "}
              <Fill value={config.supportEmail} label="e-mail de suporte" />.
            </li>
            <li>Fora desse prazo, não há reembolso proporcional de períodos já iniciados.</li>
          </ul>

          <h2>5. Uso do conteúdo</h2>
          <ul>
            <li>Os audiolivros são licenciados para uso pessoal e não comercial, apenas dentro do aplicativo.</li>
            <li>É proibido baixar, gravar, copiar, redistribuir, transmitir publicamente ou vender o conteúdo, total ou parcialmente.</li>
            <li>Os direitos autorais das obras e das narrações pertencem aos seus titulares, e o {config.appName} os utiliza mediante autorização.</li>
            <li>O catálogo pode mudar: títulos podem entrar ou sair conforme os contratos com autores, editoras e narradores.</li>
          </ul>

          <h2>6. Suspensão</h2>
          <p>
            Podemos suspender ou encerrar contas que violem estes Termos, em especial em caso de compartilhamento de acesso,
            tentativa de copiar o conteúdo ou uso de meios automatizados.
          </p>

          <h2>7. Disponibilidade</h2>
          <p>
            Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções para manutenção ou por falhas de
            terceiros (internet, hospedagem, meios de pagamento).
          </p>

          <h2>8. Alterações destes Termos</h2>
          <p>Mudanças relevantes serão avisadas por e-mail ou no aplicativo antes de entrarem em vigor.</p>

          <h2>9. Contato e foro</h2>
          <p>
            Dúvidas: <Fill value={config.supportEmail} label="e-mail de suporte" />. Fica eleito o foro do domicílio do
            consumidor, nos termos do Código de Defesa do Consumidor.
          </p>
        </Prose>
      </div>
    </div>
  );
}
