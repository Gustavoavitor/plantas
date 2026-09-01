import { createBrowserClient } from "@supabase/ssr";
import { chavePublicaSupabase, urlSupabase } from "./config";

/** Cliente Supabase para uso no navegador (componentes "use client"). */
export function criarClienteNavegador() {
  return createBrowserClient(urlSupabase(), chavePublicaSupabase());
}
