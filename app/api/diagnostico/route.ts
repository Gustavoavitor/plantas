import { NextResponse } from "next/server";
import { urlDoApp } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Estado = "ok" | "vazia" | "ausente";

/**
 * Diz quais variáveis de ambiente chegaram ao servidor.
 *
 * Devolve apenas o estado de cada uma — nenhum valor é exposto, então é
 * seguro abrir no navegador. Serve para descobrir, em produção, por que o
 * app não sobe, sem precisar cavar log de deploy.
 *
 * A distinção entre "vazia" e "ausente" importa: variável criada na Vercel
 * sem valor é um erro comum, e some no meio das outras se a gente só olhar
 * "está definida?".
 */
export async function GET() {
  function estado(...nomes: string[]): Estado {
    let algumaDefinida = false;
    for (const nome of nomes) {
      const valor = process.env[nome];
      if (valor === undefined) continue;
      algumaDefinida = true;
      if (valor.trim()) return "ok";
    }
    return algumaDefinida ? "vazia" : "ausente";
  }

  const essenciais: Record<string, Estado> = {
    NEXT_PUBLIC_SUPABASE_URL: estado("NEXT_PUBLIC_SUPABASE_URL"),
    "chave pública (ANON_KEY ou PUBLISHABLE_KEY)": estado(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
    "chave de servidor (SERVICE_ROLE_KEY ou SECRET_KEY)": estado(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
    ),
  };

  const opcionais: Record<string, Estado> = {
    PLANTNET_API_KEY: estado("PLANTNET_API_KEY"),
    PERENUAL_API_KEY: estado("PERENUAL_API_KEY"),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: estado("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    VAPID_PRIVATE_KEY: estado("VAPID_PRIVATE_KEY"),
    CRON_SECRET: estado("CRON_SECRET"),
  };

  const quebradas = Object.entries(essenciais).filter(([, e]) => e !== "ok");
  const perdidas = Object.entries(opcionais).filter(([, e]) => e !== "ok");

  const recado = (nome: string, e: Estado) =>
    e === "vazia" ? `${nome} (existe, mas está vazia)` : nome;

  return NextResponse.json(
    {
      ok: quebradas.length === 0,
      resumo:
        quebradas.length === 0
          ? perdidas.length === 0
            ? "Tudo configurado."
            : `O app sobe. Sem: ${perdidas.map(([n, e]) => recado(n, e)).join(", ")}.`
          : `O app não sobe. Resolva: ${quebradas.map(([n, e]) => recado(n, e)).join(", ")}.`,
      essenciais,
      opcionais,
      // A URL do Supabase é pública por natureza — vai no bundle do
      // navegador de qualquer jeito. Nenhuma chave aparece aqui.
      urlSupabase: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      urlDoApp: urlDoApp(),
    },
    { status: quebradas.length === 0 ? 200 : 503 },
  );
}
