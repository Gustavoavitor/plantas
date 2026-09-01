import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { chavePublicaSupabase, primeiro, urlSupabase } from "./config";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Respeita o RLS: enxerga apenas os dados de quem está logado.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    urlSupabase(),
    chavePublicaSupabase(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(paraDefinir) {
          try {
            for (const { name, value, options } of paraDefinir) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem escrever cookies. O middleware
            // já cuida de renovar a sessão, então dá para ignorar aqui.
          }
        },
      },
    },
  );
}

/**
 * Cliente com service role: ignora o RLS.
 * Use SOMENTE em rotas de servidor (cron, checagem de convite).
 * Nunca importe isto em código que roda no navegador.
 */
export function criarClienteAdmin() {
  // SUPABASE_SECRET_KEY é o nome que a integração Supabase–Vercel usa.
  // `primeiro` em vez de `??` porque variável criada vazia na Vercel venceria
  // a alternativa que tem valor de verdade.
  const chave = primeiro(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  );
  if (!chave) {
    throw new Error(
      "Defina SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) nas variáveis de ambiente.",
    );
  }

  return createClient(urlSupabase(), chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Devolve o usuário logado ou null. */
export async function usuarioAtual() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
