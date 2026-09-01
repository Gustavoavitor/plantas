import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

/** Guarda a inscrição de push do navegador deste usuário. */
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  let corpo: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo inválido" }, { status: 400 });
  }

  const { endpoint, keys } = corpo;
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    return NextResponse.json({ erro: "Inscrição incompleta" }, { status: 400 });
  }

  const { error } = await supabase.from("inscricoes_push").upsert(
    {
      usuario_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth_key: keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** Remove a inscrição quando o usuário desliga as notificações. */
export async function DELETE(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!endpoint) return NextResponse.json({ erro: "Informe o endpoint" }, { status: 400 });

  await supabase.from("inscricoes_push").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
