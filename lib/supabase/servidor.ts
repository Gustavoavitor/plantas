import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Respeita o RLS: enxerga apenas os dados de quem está logado.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
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
