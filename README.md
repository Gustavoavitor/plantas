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
| Dados de cultivo | [Perenual](https://perenual.com/docs/api) |
| Lembretes | Vercel Cron + Web Push (VAPID) |

As chaves das APIs ficam apenas no servidor, em rotas dentro de `app/api/`.
O navegador nunca as vê.

### O cronograma não é o número cru da API

`lib/cuidados.ts` pega o dado botânico da espécie e ajusta para as condições
reais da sua planta — estação do ano (hemisfério sul), ambiente, luz e tamanho
do vaso. Uma samambaia em vaso pequeno no sol de janeiro e a mesma samambaia em
vaso grande na sombra em julho recebem cronogramas bem diferentes.

### O diagnóstico é por sintoma, não por foto

Nem a Pl@ntNet nem a Perenual fazem diagnóstico de doença por imagem no plano
gratuito — a Pl@ntNet só identifica espécie. `lib/diagnostico.ts` faz o que um
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
  cuidados.ts         cálculo dos intervalos de rega e adubação
  diagnostico.ts      triagem de problemas por sintoma
  perenual.ts         cliente da Perenual + cache no Supabase
  plantnet.ts         cliente da Pl@ntNet
proxy.ts              renova a sessão e protege as rotas
supabase/schema.sql   tabelas, RLS e bucket
scripts/              gerador dos ícones do app
```

> No Next.js 16 o antigo `middleware.ts` passou a se chamar `proxy.ts`.

## Cotas

A Pl@ntNet permite 500 identificações por dia. A Perenual é mais apertada, então
`lib/perenual.ts` guarda cada espécie consultada na tabela `especies` e só
consulta de novo depois de 90 dias. Quem já foi identificado uma vez não gasta
cota nunca mais.
