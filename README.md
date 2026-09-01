# Plantas

App de cuidados com plantas: identificação por foto, cronograma de rega que se
ajusta ao seu ambiente, diagnóstico de problemas por sintoma, histórico e
lembretes por notificação.

Um único código roda como site e como app no iPhone (PWA instalável na tela de
início). Uso pessoal, restrito a convidados.

---

## Como funciona

| Parte | Tecnologia |
| --- | --- |
| Site e API | Next.js 16 (App Router) na Vercel |
| Banco, login e fotos | Supabase (Postgres + Auth + Storage) |
| Identificação por foto | [Pl@ntNet](https://my.plantnet.org/) — 500 identificações/dia grátis |
| Dados de cultivo | catálogo próprio em `lib/catalogo.ts` |
| Busca auxiliar por nome | [Perenual](https://perenual.com/docs/api) (opcional) |
| Lembretes | Vercel Cron + Web Push (VAPID) |

As chaves das APIs ficam apenas no servidor, em rotas dentro de `app/api/`.
O navegador nunca as vê.

### Por que os cuidados não vêm da Perenual

Testado na prática: no plano gratuito a Perenual devolve **só taxonomia** —
nome, família, gênero. `species/details` e `species-care-guide-list` respondem
*"Please Upgrade Plan"*, e até as imagens vêm trocadas por um
`upgrade_access.jpg`. Não há nenhum campo de rega, luz ou dificuldade.

Então os cuidados vivem em [`lib/catalogo.ts`](lib/catalogo.ts): 99 entradas
curadas, indexadas por gênero botânico, com nomes populares e dicas em
português. A Pl@ntNet já devolve gênero e família, então o casamento é direto e
a busca vai afunilando: **espécie exata → gênero → família → padrão**. É de
graça, instantâneo, sem cota e funciona offline.

A Perenual continua no projeto só para uma coisa: descobrir o nome científico
de plantas fora do catálogo, quando você busca pelo nome popular. Se a chave
faltar, o app funciona igual.

### O cronograma não é o número cru do catálogo

`lib/cuidados.ts` pega o dado botânico da espécie e ajusta para as condições
reais da sua planta — estação do ano (hemisfério sul), ambiente, luz e tamanho
do vaso. Uma samambaia em vaso pequeno no sol de janeiro e a mesma samambaia em
vaso grande na sombra em julho recebem cronogramas bem diferentes.

### O diagnóstico é por sintoma, não por foto

A Pl@ntNet só identifica espécie, e o diagnóstico da Perenual é pago.
`lib/diagnostico.ts` faz o que um
jardineiro experiente faria: cruza os sintomas que você marca com o seu
histórico de rega. Isso resolve o problema mais comum do gênero, que é
confundir sede com afogamento — os dois dão exatamente os mesmos sintomas na
folha, e só o histórico separa um do outro.

---

## Colocar para funcionar

### 1. Banco de dados

No painel do Supabase, abra **SQL Editor** e rode o conteúdo de
[`supabase/schema.sql`](supabase/schema.sql). Isso cria as tabelas, as políticas
de segurança (RLS) e o bucket de fotos.

Depois, libere o seu acesso — só quem está nesta tabela consegue entrar:

```sql
insert into convites (email, nome) values
  ('seu@email.com', 'Gustavo'),
  ('amigo@email.com', 'Fulano');
```

### 2. Chaves

Copie `.env.example` para `.env.local` e preencha:

- **Supabase** — painel do projeto, em *Project Settings → API*. Precisa da URL,
  da chave `anon` e da chave `service_role`.
- **Pl@ntNet** — <https://my.plantnet.org/> → *Settings → API key*.
- **Perenual** — <https://perenual.com/docs/api> → painel da conta.

As chaves VAPID e o `CRON_SECRET` já vêm gerados no seu `.env.local`.

### 3. Rodar na sua máquina

```bash
npm run dev
```

### 4. Publicar

Na Vercel, importe o repositório e cole **todas** as variáveis do `.env.local`
em *Settings → Environment Variables*. Ajuste `NEXT_PUBLIC_URL` para o endereço
final do site.

No Supabase, em *Authentication → URL Configuration*, adicione o endereço da
Vercel em **Site URL** e em **Redirect URLs** (incluindo
`https://seu-site.vercel.app/auth/callback`). Sem isso o link do e-mail não
funciona em produção.

O cron de lembretes já está declarado em `vercel.json` e roda às 8h de Brasília.

### 5. Instalar no iPhone

Abra o site no **Safari** → botão Compartilhar → *Adicionar à Tela de Início*.

No iOS, notificação web só funciona com o app instalado assim. Depois de
instalar, abra pelo ícone e ative os lembretes em *Ajustes*.

---

## Mapa do código

```
app/
  (interno)/          telas com login: jardim, nova, planta/[id], ajustes
  api/
    identificar/      recebe a foto → Pl@ntNet → Perenual
    especie/          busca e detalhes de espécie (com cache)
    push/             inscrição e teste de notificação
    cron/lembretes/   varredura diária, chamada pela Vercel
  acoes.ts            server actions: toda escrita no banco passa aqui
  auth/callback/      troca o link do e-mail por sessão + checa convite
lib/
  catalogo.ts         cuidados por gênero, com nomes e dicas em português
  cuidados.ts         cálculo dos intervalos de rega e adubação
  diagnostico.ts      triagem de problemas por sintoma
  plantnet.ts         cliente da Pl@ntNet
  perenual.ts         busca auxiliar de nome científico (opcional)
proxy.ts              renova a sessão e protege as rotas
supabase/schema.sql   tabelas, RLS e bucket
scripts/
  gerar-icones.mjs    ícones do app, sem editor de imagem
  conferir-cuidados.ts confere catálogo e cálculo de rega
```

> No Next.js 16 o antigo `middleware.ts` passou a se chamar `proxy.ts`.

## Cotas

A Pl@ntNet permite 500 identificações por dia — só é consumida quando você
cadastra uma planta nova. Os cuidados vêm do catálogo local e não gastam nada.

As tabelas `especies` e a coluna `plantas.especie_id` continuam no schema, sem
uso hoje. Ficaram ali de propósito: se um dia você assinar a Perenual, é onde o
cache dos dados pagos entra sem precisar mexer no banco.

## Ampliar o catálogo

Achou uma planta que caiu em "gênero" ou "família"? Abra
[`lib/catalogo.ts`](lib/catalogo.ts) e acrescente uma entrada em `GENEROS`
(chave = gênero em minúsculas) ou um ajuste em `ESPECIES` (chave = `"genero
especie"`). Depois rode:

```bash
node scripts/conferir-cuidados.ts
```

O script confere o casamento de nomes, simula rega em verão e inverno e valida
que toda entrada tem nome popular, dicas, luz e um `regaDias` plausível.
