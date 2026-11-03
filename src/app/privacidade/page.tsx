import Link from "next/link";
import { DraftNotice, Fill, Prose } from "@/components/Footer";
import { config } from "@/lib/config";

export const metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  const empresa = <Fill value={config.legalName} label="razão social" />;
  const email = <Fill value={config.supportEmail} label="e-mail de contato" />;
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-2 text-4xl font-semibold">Política de privacidade</h1>
      <p className="mb-6 text-sm text-muted">Última atualização: <Fill value="" label="data da publicação" /></p>
      <DraftNotice />
      <div className="mt-8">
        <Prose>
          <p>
            Esta política explica como {empresa} (CNPJ <Fill value={config.legalId} label="CNPJ" />), responsável pelo{" "}
            {config.appName}, trata seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>

          <h2>1. Dados que coletamos</h2>
          <ul>
            <li><strong>Cadastro:</strong> nome, e-mail e senha (guardada de forma criptografada, sem que possamos lê-la).</li>
            <li><strong>Cobrança:</strong> CPF, exigido para emitir a cobrança, e a situação dos pagamentos. Os dados do cartão são digitados diretamente na página do Asaas e não passam por nós.</li>
            <li><strong>Uso do serviço:</strong> onde você parou em cada livro, sua estante e suas avaliações.</li>
            <li><strong>Segurança:</strong> endereço IP e horário de tentativas de login, para impedir acessos indevidos.</li>
          </ul>

          <h2>2. Para que usamos</h2>
          <ul>
            <li>Prestar o serviço contratado: liberar o acesso, salvar seu progresso e cobrar a assinatura (execução de contrato, art. 7º, V, da LGPD).</li>
            <li>Cumprir obrigações legais e fiscais, como guardar registros de pagamento e de acesso (art. 7º, II).</li>
            <li>Proteger sua conta e o serviço contra fraudes (legítimo interesse, art. 7º, IX).</li>
            <li>Enviar e-mails sobre sua conta, como cobranças e recuperação de senha.</li>
          </ul>
          <p>Não vendemos seus dados e não os usamos para publicidade de terceiros.</p>

          <h2>3. Com quem compartilhamos</h2>
          <p>Somente com empresas que operam o serviço em nosso nome:</p>
          <ul>
            <li><strong>Asaas</strong>: processamento de pagamentos (nome, e-mail e CPF).</li>
            <li><strong>Vercel</strong>: hospedagem do aplicativo.</li>
            <li><strong>Supabase</strong>: banco de dados e armazenamento de arquivos.</li>
            <li><strong>Resend</strong>: envio de e-mails.</li>
          </ul>
          <p>
            Alguns desses fornecedores guardam dados em servidores fora do Brasil. Essa transferência segue o art. 33 da LGPD,
            com contratos que exigem proteção adequada.
          </p>

          <h2>4. Cookies</h2>
          <p>Usamos apenas um cookie essencial, que mantém você conectado. Não usamos cookies de rastreamento ou publicidade.</p>

          <h2>5. Por quanto tempo guardamos</h2>
          <ul>
            <li>Dados de cadastro e uso: enquanto a conta existir.</li>
            <li>Registros de pagamento: pelo prazo exigido pela legislação fiscal, mesmo após a exclusão da conta, sem identificação pessoal.</li>
            <li>Registros de acesso: 6 meses, conforme o Marco Civil da Internet (Lei nº 12.965/2014, art. 15).</li>
          </ul>

          <h2>6. Seus direitos</h2>
          <p>Pelo art. 18 da LGPD, você pode, a qualquer momento:</p>
          <ul>
            <li>confirmar se tratamos seus dados e acessá-los;</li>
            <li>corrigir dados incompletos ou desatualizados;</li>
            <li>pedir a portabilidade ou a eliminação dos dados;</li>
            <li>revogar consentimentos e obter informações sobre compartilhamento.</li>
          </ul>
          <p>
            A exclusão pode ser feita direto em <Link href="/conta">Minha conta</Link>. Para os demais pedidos, escreva para {email}.
            Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
          </p>

          <h2>7. Encarregado de dados</h2>
          <p>
            Encarregado (DPO): <Fill value="" label="nome do encarregado" />, contato: {email}.
          </p>

          <h2>8. Alterações</h2>
          <p>Avisaremos por e-mail ou no aplicativo antes de qualquer mudança relevante nesta política.</p>
        </Prose>
      </div>
    </div>
  );
}
