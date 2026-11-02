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

Uma combinação que funciona bem:

| Parte | Serviço sugerido | Por quê |
|---|---|---|
| App | [Vercel](https://vercel.com) | Feito para Next.js e tem plano gratuito para começar |
| Banco | [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (só o Postgres) | Postgres gerenciado |
| Áudios e capas | [Cloudflare R2](https://developers.cloudflare.com/r2/) | Compatível com S3 e sem cobrança por tráfego de saída, o que importa para áudio |

### 1. Banco
Crie o banco e rode `npm run db:migrate` apontando `DATABASE_URL` para ele. Se o provedor exigir SSL, defina `DATABASE_SSL=true`.

### 2. Armazenamento (R2)
1. Crie um bucket e um token de API com permissão de leitura e escrita nele.
2. Configure o CORS do bucket para permitir o envio direto pelo navegador (troque o domínio):
   ```json
   [{ "AllowedOrigins": ["https://SEU-DOMINIO"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
3. Variáveis: `STORAGE_DRIVER=s3`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID` e `S3_SECRET_ACCESS_KEY`.

> O modo `local` (pasta `./storage`) serve só para desenvolvimento. Na Vercel os arquivos locais se perdem.

### 3. Asaas
1. Crie a conta no [sandbox](https://sandbox.asaas.com) primeiro e gere a chave de API.
2. Variáveis: `ASAAS_API_URL=https://api-sandbox.asaas.com/v3` e `ASAAS_API_KEY`.
3. Em *Integrações > Webhooks*, cadastre:
   - URL: `https://SEU-DOMINIO/api/webhooks/asaas`
   - Token de autenticação: o mesmo valor de `ASAAS_WEBHOOK_TOKEN`
   - Eventos: cobranças (`PAYMENT_*`) e assinaturas (`SUBSCRIPTION_*`)
4. Faça um ciclo completo de teste. Depois troque para a conta de produção (`https://api.asaas.com/v3`) e a chave real.

### 4. Demais variáveis
`APP_URL`, `NEXT_PUBLIC_APP_NAME`, `SESSION_SECRET` (gere com `openssl rand -base64 32`), `PLAN_PRICE`, `PLAN_DESCRIPTION` e `GRACE_DAYS`.

### 5. Administrador
Com o banco de produção no `DATABASE_URL`: `npm run admin:create -- seu@email.com "Seu Nome" senha`.

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
