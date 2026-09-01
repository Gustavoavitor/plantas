-- ============================================================
-- plantas - schema completo
-- Rode isto no SQL Editor do Supabase (uma vez so).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Lista de e-mails autorizados (voce, amigos e familia)
-- ------------------------------------------------------------
create table if not exists convites (
  email      text primary key,
  nome       text,
  criado_em  timestamptz not null default now()
);

alter table convites enable row level security;
-- Sem policy = ninguem le pelo navegador. So o servidor (service role) enxerga.
-- Isso e de proposito.

-- ------------------------------------------------------------
-- 2. Perfis
-- ------------------------------------------------------------
create table if not exists perfis (
  id            uuid primary key references auth.users on delete cascade,
  nome          text,
  fuso          text not null default 'America/Sao_Paulo',
  hora_lembrete smallint not null default 8,
  criado_em     timestamptz not null default now()
);

alter table perfis enable row level security;

drop policy if exists "perfil proprio - ler" on perfis;
drop policy if exists "perfil proprio - criar" on perfis;
drop policy if exists "perfil proprio - editar" on perfis;

create policy "perfil proprio - ler"    on perfis for select using (auth.uid() = id);
create policy "perfil proprio - criar"  on perfis for insert with check (auth.uid() = id);
create policy "perfil proprio - editar" on perfis for update using (auth.uid() = id);

-- Cria o perfil sozinho quando alguem entra pela primeira vez
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$func$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- ------------------------------------------------------------
-- 3. Cache de especies (dados da Perenual)
--    Guardamos aqui para nao estourar a cota diaria da API.
-- ------------------------------------------------------------
create table if not exists especies (
  id              bigint primary key,
  nome_cientifico text not null,
  nome_comum      text,
  ciclo           text,
  rega            text,
  rega_dias       smallint,
  luz             text[],
  interno         boolean,
  tolera_seca     boolean,
  nivel_cuidado   text,
  toxica_animais  boolean,
  descricao       text,
  imagem_url      text,
  dados           jsonb,
  atualizado_em   timestamptz not null default now()
);

alter table especies enable row level security;

drop policy if exists "especies - leitura logada" on especies;
create policy "especies - leitura logada" on especies for select
  to authenticated using (true);

create index if not exists especies_nome_cientifico_idx
  on especies (lower(nome_cientifico));

-- ------------------------------------------------------------
-- 4. Plantas
-- ------------------------------------------------------------
create table if not exists plantas (
  id                   uuid primary key default gen_random_uuid(),
  usuario_id           uuid not null references auth.users on delete cascade,
  apelido              text not null,
  especie_id           bigint references especies(id) on delete set null,
  nome_cientifico      text,
  nome_comum           text,
  foto_url             text,
  ambiente             text not null default 'interno'
                         check (ambiente in ('interno','varanda','externo')),
  luz                  text not null default 'luz_indireta'
                         check (luz in ('sol_direto','luz_indireta','meia_sombra','sombra')),
  tamanho_vaso         text not null default 'medio'
                         check (tamanho_vaso in ('pequeno','medio','grande','canteiro')),
  intervalo_rega_dias  smallint not null default 7
                         check (intervalo_rega_dias between 1 and 120),
  intervalo_aduba_dias smallint not null default 30
                         check (intervalo_aduba_dias between 0 and 365),
  ultima_rega          date,
  ultima_aduba         date,
  notas                text,
  arquivada            boolean not null default false,
  criado_em            timestamptz not null default now()
);

alter table plantas enable row level security;

drop policy if exists "plantas proprias" on plantas;
create policy "plantas proprias" on plantas for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create index if not exists plantas_usuario_idx on plantas (usuario_id);

-- ------------------------------------------------------------
-- 5. Historico de cuidados
-- ------------------------------------------------------------
create table if not exists eventos_cuidado (
  id         uuid primary key default gen_random_uuid(),
  planta_id  uuid not null references plantas on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  tipo       text not null check (tipo in ('rega','adubacao','poda','replantio','nota')),
  data       date not null default current_date,
  observacao text,
  criado_em  timestamptz not null default now()
);

alter table eventos_cuidado enable row level security;

drop policy if exists "eventos proprios" on eventos_cuidado;
create policy "eventos proprios" on eventos_cuidado for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

create index if not exists eventos_planta_idx on eventos_cuidado (planta_id, data desc);

-- Ao registrar rega/adubacao, atualiza a data na planta sozinho
create or replace function public.atualizar_ultimo_cuidado()
returns trigger
language plpgsql
as $func$
begin
  if new.tipo = 'rega' then
    update plantas set ultima_rega = greatest(coalesce(ultima_rega, new.data), new.data)
      where id = new.planta_id;
  elsif new.tipo = 'adubacao' then
    update plantas set ultima_aduba = greatest(coalesce(ultima_aduba, new.data), new.data)
      where id = new.planta_id;
  end if;
  return new;
end;
$func$;

drop trigger if exists ao_registrar_cuidado on eventos_cuidado;
create trigger ao_registrar_cuidado
  after insert on eventos_cuidado
  for each row execute function public.atualizar_ultimo_cuidado();

-- ------------------------------------------------------------
-- 6. Fotos (diario visual + fotos de diagnostico)
-- ------------------------------------------------------------
create table if not exists fotos (
  id         uuid primary key default gen_random_uuid(),
  planta_id  uuid not null references plantas on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  url        text not null,
  tipo       text not null default 'registro' check (tipo in ('registro','diagnostico')),
  legenda    text,
  criado_em  timestamptz not null default now()
);

alter table fotos enable row level security;

drop policy if exists "fotos proprias" on fotos;
create policy "fotos proprias" on fotos for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ------------------------------------------------------------
-- 7. Diagnosticos
-- ------------------------------------------------------------
create table if not exists diagnosticos (
  id         uuid primary key default gen_random_uuid(),
  planta_id  uuid not null references plantas on delete cascade,
  usuario_id uuid not null references auth.users on delete cascade,
  sintomas   text[] not null default '{}',
  foto_url   text,
  resultado  jsonb not null,
  criado_em  timestamptz not null default now()
);

alter table diagnosticos enable row level security;

drop policy if exists "diagnosticos proprios" on diagnosticos;
create policy "diagnosticos proprios" on diagnosticos for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ------------------------------------------------------------
-- 8. Inscricoes de notificacao push
-- ------------------------------------------------------------
create table if not exists inscricoes_push (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  criado_em  timestamptz not null default now()
);

alter table inscricoes_push enable row level security;

drop policy if exists "push proprio" on inscricoes_push;
create policy "push proprio" on inscricoes_push for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ------------------------------------------------------------
-- 9. Bucket de fotos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos - enviar" on storage.objects;
drop policy if exists "fotos - apagar" on storage.objects;
drop policy if exists "fotos - ver" on storage.objects;

-- Cada pessoa so escreve dentro da propria pasta: fotos/<user_id>/...
create policy "fotos - enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos - apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos - ver" on storage.objects for select
  using (bucket_id = 'fotos');
