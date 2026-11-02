# Audiobook

Aplicativo web instalável (PWA) para distribuir audiobooks por assinatura mensal, com pagamento por Pix ou cartão de crédito via [Asaas](https://www.asaas.com).

## O que tem

**Para o ouvinte**
- Cadastro e login com e-mail e senha
- Assinatura mensal (valor em `PLAN_PRICE`) por Pix ou cartão
- Catálogo, página do livro e lista de faixas
- Player que continua tocando enquanto a pessoa navega pelo app, com:
  - marcação automática de onde parou (salva a cada 15 s e ao pausar)
  - velocidade de 0,8× a 2×, voltar 15 s e avançar 30 s
  - temporizador para desligar
  - controles na tela de bloqueio e nos fones (Media Session)
- "Minha conta": situação da assinatura, faturas e cancelamento
- Instalável na tela inicial do celular

**Para você (administrador)**
- Painel com cadastros, assinantes ativos e valor recebido no mês
- Cadastro de livros (título, autor, narração, sinopse e capa)
- Envio de vários arquivos de áudio de uma vez. A ordem segue o nome do arquivo, e dá para renomear, reordenar e excluir depois
- Publicar e despublicar

**Proteção do conteúdo**
- O áudio só é entregue a quem está logado e com assinatura em dia
- Em produção, cada arquivo é servido por um link temporário do armazenamento, então o endereço não fica público
- Nenhuma proteção impede que alguém grave o som enquanto ouve. O objetivo é dificultar a cópia dos arquivos, não torná-la impossível

## Como funciona a cobrança

1. A pessoa informa o CPF (exigido pelo Asaas) e escolhe Pix ou cartão.
2. O app cria o cliente e uma assinatura `MONTHLY` no Asaas, e a pessoa é levada à fatura do Asaas para pagar.
3. O Asaas avisa o app pelo webhook. Com `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`, o acesso é liberado até o próximo vencimento mais `GRACE_DAYS` de tolerância.
4. Com `PAYMENT_OVERDUE`, a assinatura fica marcada como em atraso e o acesso termina quando a tolerância acaba. Estorno e chargeback cortam o acesso na hora.
5. Se a pessoa cancelar, o acesso continua até o fim do período já pago.

**Pix:** todo mês o Asaas gera uma nova cobrança e envia por e-mail. A pessoa precisa pagar manualmente.
**Cartão:** a cobrança é recorrente no mesmo cartão.

> **Teste no sandbox antes de ir para produção:** confirme que, no cartão, as cobranças seguintes saem automaticamente depois do primeiro pagamento pela fatura, e que as notificações de cobrança do Pix chegam ao cliente. Ajuste em *Configurações > Notificações* no painel do Asaas.

## Rodar no computador

Requisitos: Node.js 20 ou mais recente e PostgreSQL.

```bash
npm install
cp .env.example .env        # depois edite DATABASE_URL e SESSION_SECRET
npm run db:migrate
npm run admin:create -- seu@email.com "Seu Nome" uma-senha-forte
npm run dev
```

Abra http://localhost:3000.

Sem `ASAAS_API_KEY`, o app roda em **modo simulado**: a fatura é uma página local com o botão "Simular pagamento", e nenhuma cobrança real é feita.

## Publicar (produção)

Caminho mais simples: **Supabase** para banco e áudios, **Vercel** para o app. Os dois têm plano gratuito para começar.

### 1. Supabase (banco e arquivos)
1. Crie um projeto em [supabase.com](https://supabase.com) e anote a senha do banco.
2. **Banco:** clique em *Connect* e copie a connection string do **Transaction pooler** (porta 6543). Troque `[YOUR-PASSWORD]` pela senha. Esse valor vai em `DATABASE_URL`, junto com `DATABASE_SSL=true`.
3. **Arquivos:** em *Storage*, crie um bucket **privado** chamado `audiobook`.
4. Em *Storage > Settings > S3 Connection*, ative a conexão S3 e crie uma *access key*. Anote:
   - `S3_ENDPOINT` = o endpoint mostrado (termina em `/storage/v1/s3`)
   - `S3_REGION` = a região mostrada
   - `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY` = a chave criada
   - `S3_BUCKET=audiobook`, `S3_FORCE_PATH_STYLE=true`, `STORAGE_DRIVER=s3`

> No plano gratuito do Supabase, cada arquivo pode ter no máximo 50 MB. Exporte os capítulos em MP3 mono de 64 kbps, que dá cerca de 28 MB por hora. Projetos gratuitos também são pausados depois de um período sem uso. Para operar com assinantes, use o plano pago.

### 2. Vercel (app)
1. Entre em [vercel.com](https://vercel.com) com sua conta do GitHub e importe o repositório `audiobook`.
2. Antes de clicar em *Deploy*, abra *Environment Variables* e cadastre:
   - as variáveis do Supabase acima
   - `SESSION_SECRET`: uma frase aleatória longa, com no mínimo 32 caracteres
   - `ADMIN_EMAILS`: o seu e-mail
   - `ASAAS_WEBHOOK_TOKEN`: qualquer frase longa
   - `PLAN_PRICE=19.90` e `NEXT_PUBLIC_APP_NAME` com o nome do app
3. Clique em *Deploy*. As tabelas são criadas automaticamente durante a publicação.
4. Copie o endereço gerado (`https://....vercel.app`), coloque em `APP_URL` e publique de novo em *Deployments > Redeploy*.
5. Abra o endereço, crie sua conta em **Cadastro** com o e-mail de `ADMIN_EMAILS`, e o menu **Admin** aparece.

Sem `ASAAS_API_KEY`, a tela de assinatura em produção mostra "Pagamentos ainda não configurados". Para testar o fluxo completo antes de configurar o Asaas, cadastre `ALLOW_SIMULATED_PAYMENTS=true`: isso ativa o botão "Simular pagamento". **Remova essa variável antes de divulgar o endereço**, porque com ela qualquer pessoa libera o acesso sem pagar.

### 3. Asaas (cobrança real)
1. Crie a conta no [sandbox](https://sandbox.asaas.com) primeiro e gere a chave de API.
2. Na Vercel: `ASAAS_API_URL=https://api-sandbox.asaas.com/v3` e `ASAAS_API_KEY`.
3. No Asaas, em *Integrações > Webhooks*, cadastre:
   - URL: `https://SEU-DOMINIO/api/webhooks/asaas`
   - Token de autenticação: o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - Eventos: cobranças (`PAYMENT_*`) e assinaturas (`SUBSCRIPTION_*`)
4. Faça um ciclo completo de teste. Depois troque para a conta de produção (`https://api.asaas.com/v3`) e a chave real.

### Alternativa para os áudios: Cloudflare R2
Quando o volume crescer, o R2 é mais barato para áudio porque não cobra tráfego de saída. Use `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto` e `S3_FORCE_PATH_STYLE=false`, e configure o CORS do bucket:
```json
[{ "AllowedOrigins": ["https://SEU-DOMINIO"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```

> O modo `local` (pasta `./storage`) serve só para desenvolvimento. Na Vercel os arquivos locais se perdem.

## Antes de abrir ao público

- [ ] Termos de uso e política de privacidade (a LGPD se aplica porque o app guarda nome, e-mail e CPF)
- [ ] Contratos de licença de cada obra, com autor ou editora e com o narrador
- [ ] Recuperação de senha por e-mail (ainda não implementada)
- [ ] Limite de tentativas de login (o provedor de hospedagem ou um WAF resolve)
- [ ] Ícone e nome definitivos (`public/icons/icon.svg` e `NEXT_PUBLIC_APP_NAME`)

## Estrutura

```
db/schema.sql                 tabelas do banco
scripts/                      migração e criação de administrador
src/lib/asaas.ts              cliente da API do Asaas (com modo simulado)
src/lib/billing.ts            regras de liberação de acesso a partir dos webhooks
src/lib/storage.ts            armazenamento local ou S3/R2
src/components/player/        player global
src/app/api/webhooks/asaas    recebe os avisos de pagamento
src/app/admin                 painel administrativo
```
