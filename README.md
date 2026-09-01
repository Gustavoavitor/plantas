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

Este projeto está em **https://plantas-seven.vercel.app**.

Na Vercel, em *Settings → Environment Variables*, cole **todas** as variáveis do
`.env.local` — use o campo de importar `.env`, que preenche nome e valor de uma
vez.

> **A importação não sobrescreve.** Se a variável já existe, a Vercel rejeita o
> lote inteiro com *"already exists"*. Apague as antigas antes de reimportar, ou
> edite uma a uma.

> **Cuidado com a variável vazia.** Colar só os nomes, sem valor, cria a
> variável em branco — e o app quebra exatamente como se ela não existisse. Para
> conferir depois do deploy, abra
> [`/api/diagnostico`](https://plantas-seven.vercel.app/api/diagnostico): ele
> diz `ok`, `vazia` ou `ausente` para cada uma, sem expor nenhum valor.

Não existe variável de URL do app: em produção a Vercel injeta
`VERCEL_PROJECT_PRODUCTION_URL` sozinha, e as notificações usam caminho
relativo.

Variável nova só passa a valer no **próximo deploy** — depois de salvar, use
*Deployments → ⋯ → Redeploy*.

No Supabase, em *Authentication → URL Configuration*:

- **Site URL**: `https://plantas-seven.vercel.app` — com o `https://`, senão o
  link do e-mail sai quebrado.
- **Redirect URLs**: `https://plantas-seven.vercel.app/**`

Use o domínio de produção. O endereço `plantas-<time>.vercel.app` é protegido
por SSO da Vercel e não serve para o retorno do login.

O cron de lembretes já está declarado em `vercel.json` e roda às 8h de Brasília.

### 5. Instalar no celular

A tela de *Ajustes* detecta o aparelho e mostra o caminho certo.

| Aparelho | Como |
| --- | --- |
| Android | Chrome mostra o botão **Instalar** direto em Ajustes |
| iPhone | Safari → Compartilhar → *Adicionar à Tela de Início* (manual, o iOS não oferece botão) |
| Computador | Chrome ou Edge: ícone de instalar na barra de endereço |

No iOS, notificação web **só existe** com o app instalado na tela de início. No
Android funciona mesmo pelo navegador, mas instalado é melhor.

---

## Convidar mais gente

Só quem está na tabela `convites` consegue entrar. Para adicionar, rode no SQL
Editor do Supabase:

```sql
insert into convites (email, nome) values
  ('pessoa@exemplo.com', 'Nome dela')
on conflict (email) do nothing;
```

O e-mail precisa bater exatamente com o que a pessoa digitar, em minúsculas.
Quem não está na lista tem a conta apagada no retorno do login e vê a mensagem
de acesso restrito.

Para remover alguém:

```sql
delete from convites where email = 'pessoa@exemplo.com';
```

Isso impede novos logins, mas **não** encerra a sessão de quem já entrou nem
apaga as plantas. Para cortar o acesso na hora, apague também o usuário em
*Authentication → Users*.

---

## Como funcionam os lembretes

```
Vercel Cron (1×/dia)  →  GET /api/cron/lembretes
                             ↓  Authorization: Bearer CRON_SECRET
                         varre todas as plantas não arquivadas
                             ↓  statusRega / statusAdubacao
                         agrupa as pendências por pessoa
                             ↓  web-push, assinado com VAPID
                         service worker  →  notificação no aparelho
```

- **Uma notificação por pessoa**, não uma por planta — quem tem dez plantas
  atrasadas recebe um aviso só, dizendo "Regar 10 plantas".
- Entram no aviso: rega atrasada, rega de hoje, planta nunca regada, e adubação
  atrasada quando não está pausada.
- O horário está em `vercel.json` (`0 11 * * *` = 8h de Brasília). O campo
  `perfis.hora_lembrete` existe no banco mas **não é usado**: o plano Hobby da
  Vercel não permite cron de hora em hora, que seria necessário para respeitar
  o horário de cada pessoa.
- Inscrição expirada (app desinstalado, permissão revogada) devolve 404 ou 410
  e é apagada sozinha do banco.

Para testar sem esperar o dia seguinte: *Ajustes → Enviar teste*, ou
`vercel crons run /api/cron/lembretes`.

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
