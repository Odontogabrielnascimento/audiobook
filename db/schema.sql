-- Esquema do banco. Idempotente: pode rodar varias vezes (npm run db:migrate).
create extension if not exists pgcrypto;

create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null unique,
  password_hash     text not null,
  cpf               text,
  role              text not null default 'user' check (role in ('user', 'admin')),
  asaas_customer_id text unique,
  created_at        timestamptz not null default now()
);

-- Uma assinatura por usuario. access_until define ate quando o acesso esta liberado.
create table if not exists subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references users(id) on delete cascade,
  asaas_subscription_id text unique,
  billing_type          text not null check (billing_type in ('PIX', 'CREDIT_CARD')),
  status                text not null default 'pending'
                        check (status in ('pending', 'active', 'overdue', 'canceled')),
  access_until          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists payments (
  asaas_payment_id text primary key,
  user_id          uuid not null references users(id) on delete cascade,
  status           text not null,
  billing_type     text,
  value            numeric(10, 2) not null,
  due_date         date not null,
  invoice_url      text,
  updated_at       timestamptz not null default now()
);
create index if not exists payments_user_idx on payments (user_id, due_date desc);

-- Registro de eventos de webhook ja processados (evita processar duas vezes)
create table if not exists webhook_events (
  id          text primary key,
  event       text not null,
  received_at timestamptz not null default now()
);

create table if not exists books (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  author      text not null,
  narrator    text,
  description text not null default '',
  cover_key   text,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists chapters (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid not null references books(id) on delete cascade,
  position         integer not null,
  title            text not null,
  audio_key        text not null,
  duration_seconds integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists chapters_book_idx on chapters (book_id, position);

-- Onde o ouvinte parou em cada livro
create table if not exists progress (
  user_id          uuid not null references users(id) on delete cascade,
  book_id          uuid not null references books(id) on delete cascade,
  chapter_id       uuid not null references chapters(id) on delete cascade,
  position_seconds integer not null default 0,
  updated_at       timestamptz not null default now(),
  primary key (user_id, book_id)
);

-- ===== Fase 1: descoberta e biblioteca pessoal =====

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists book_categories (
  book_id     uuid not null references books(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (book_id, category_id)
);
create index if not exists book_categories_cat_idx on book_categories (category_id);

create table if not exists series (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table books add column if not exists series_id uuid references series(id) on delete set null;
alter table books add column if not exists series_position integer;

-- Estante pessoal: "quero ouvir" e "concluidos"
create table if not exists shelf (
  user_id    uuid not null references users(id) on delete cascade,
  book_id    uuid not null references books(id) on delete cascade,
  status     text not null check (status in ('want', 'finished')),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists ratings (
  user_id    uuid not null references users(id) on delete cascade,
  book_id    uuid not null references books(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index if not exists ratings_book_idx on ratings (book_id);

-- ===== Visual =====
alter table books add column if not exists featured boolean not null default false;

create table if not exists site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
