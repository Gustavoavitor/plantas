/**
 * Resolve as variáveis públicas do Supabase.
 *
 * Existem duas convenções de nome em circulação:
 *  - a clássica, do painel do Supabase: NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  - a nova, que a integração Supabase–Vercel cria sozinha:
 *    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * Aceitamos as duas para o app funcionar tanto com as variáveis coladas à mão
 * quanto com as que a integração gera.
 *
 * Importante: cada `process.env.NEXT_PUBLIC_*` está escrito de forma literal
 * porque o Next substitui essas expressões em tempo de build. Montar o nome
 * da variável dinamicamente não funcionaria no navegador.
 */

/**
 * Primeiro valor de verdade da lista.
 *
 * Trata string vazia como ausente de propósito: na Vercel é fácil acabar com
 * uma variável criada mas sem valor, e `??` deixaria essa passar, escondendo
 * a variável seguinte que estava certa.
 */
function primeiro(...valores: Array<string | undefined>): string | undefined {
  for (const valor of valores) {
    const limpo = valor?.trim();
    if (limpo) return limpo;
  }
  return undefined;
}

function exigir(valor: string | undefined, nomes: string[]): string {
  if (valor) return valor;
  throw new Error(
    `Variável de ambiente ausente ou vazia. Defina uma destas: ${nomes.join(" ou ")}. ` +
      "Na Vercel isso fica em Settings → Environment Variables, e depois é " +
      "preciso refazer o deploy para o novo valor valer.",
  );
}

export function urlSupabase(): string {
  const bruta = primeiro(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL,
  );

  const url = exigir(bruta, ["NEXT_PUBLIC_SUPABASE_URL"]).replace(/\/$/, "");

  // Erro comum: colar só o ID do projeto em vez do endereço completo.
  if (!url.startsWith("http")) {
    return `https://${url}${url.includes(".") ? "" : ".supabase.co"}`;
  }
  return url;
}

export function chavePublicaSupabase(): string {
  return exigir(
    primeiro(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  );
}

/**
 * Endereço público do app, usado nos links das notificações.
 * Em produção a Vercel preenche VERCEL_PROJECT_PRODUCTION_URL sozinha.
 */
export function urlDoApp(): string {
  const explicita = primeiro(process.env.NEXT_PUBLIC_URL);
  if (explicita) return explicita.replace(/\/$/, "");

  const daVercel = primeiro(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  );
  if (daVercel) return `https://${daVercel}`;

  return "http://localhost:3000";
}
