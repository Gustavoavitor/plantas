import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diz quais variáveis de ambiente chegaram ao servidor.
 *
 * Devolve apenas true/false — nenhum valor é exposto, então é seguro
 * abrir no navegador. Serve para descobrir, em produção, por que o app
 * não sobe, sem precisar cavar log de deploy.
 */
export async function GET() {
  const presente = (...nomes: string[]) => nomes.some((n) => Boolean(process.env[n]));

  const essenciais = {
    "URL do Supabase": presente("NEXT_PUBLIC_SUPABASE_URL"),
    "Chave pública do Supabase": presente(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
    "Chave de servidor do Supabase": presente(
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
    ),
  };

  const opcionais = {
    "Pl@ntNet (identificar por foto)": presente("PLANTNET_API_KEY"),
    "Perenual (busca por nome)": presente("PERENUAL_API_KEY"),
    "Push — chave pública": presente("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    "Push — chave privada": presente("VAPID_PRIVATE_KEY"),
    "Segredo do cron": presente("CRON_SECRET"),
  };

  const faltando = [
    ...Object.entries(essenciais).filter(([, ok]) => !ok).map(([nome]) => nome),
  ];

  // A URL só aparece aqui porque é pública por natureza (vai no bundle
  // do navegador de qualquer jeito). Nenhuma chave é exposta.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  return NextResponse.json(
    {
      ok: faltando.length === 0,
      resumo: faltando.length === 0
        ? "Todas as variáveis essenciais estão presentes."
        : `Faltando: ${faltando.join(", ")}.`,
      essenciais,
      opcionais,
      urlSupabase: url,
      urlDoApp:
        process.env.NEXT_PUBLIC_URL ??
        process.env.VERCEL_PROJECT_PRODUCTION_URL ??
        null,
    },
    { status: faltando.length === 0 ? 200 : 503 },
  );
}
