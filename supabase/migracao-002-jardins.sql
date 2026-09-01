-- ============================================================
-- Migração 002 — jardins em locais diferentes e título próprio
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- Jardins: cada lugar onde a pessoa tem plantas
-- ------------------------------------------------------------
create table if not exists jardins (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade,
  nome       text not null,
  -- Cidade ou bairro, só para exibição.
  local      text,
  -- Coordenadas para o clima daquele jardim. Opcional.
  latitude   double precision,
  longitude  double precision,
  criado_em  timestamptz not null default now()
);

alter table jardins enable row level security;

drop policy if exists "jardins proprios" on jardins;
create policy "jardins proprios" on jardins for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create index if not exists jardins_usuario_idx on jardins (usuario_id);

-- ------------------------------------------------------------
-- Plantas passam a pertencer a um jardim (opcional)
-- ------------------------------------------------------------
alter table plantas
  add column if not exists jardim_id uuid references jardins(id) on delete set null;

create index if not exists plantas_jardim_idx on plantas (jardim_id);

-- ------------------------------------------------------------
-- Título do jardim na home ("Jardim do Gustavo")
--
-- É texto livre em vez de montar "do/da/de" a partir do nome: não dá
-- para adivinhar o artigo certo para qualquer nome, e assim cada pessoa
-- escreve como preferir.
-- ------------------------------------------------------------
alter table perfis
  add column if not exists titulo_jardim text;
