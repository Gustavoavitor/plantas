import { NextResponse } from "next/server";
import { enviarAviso, type Inscricao } from "@/lib/push";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

/** Dispara uma notificação de teste para os aparelhos deste usuário. */
export async function POST() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { data } = await supabase
    .from("inscricoes_push")
    .select("id, endpoint, p256dh, auth_key")
    .eq("usuario_id", user.id);

  const inscricoes = (data ?? []) as Inscricao[];
  if (inscricoes.length === 0) {
    return NextResponse.json({ erro: "Nenhum aparelho inscrito" }, { status: 400 });
  }

  let enviados = 0;
  for (const inscricao of inscricoes) {
    const r = await enviarAviso(inscricao, {
      titulo: "Funcionou 🌿",
      corpo: "As notificações estão ativas neste aparelho.",
      url: "/jardim",
      tag: "teste",
    });

    if (r === "enviado") enviados++;
    if (r === "expirada") {
      await supabase.from("inscricoes_push").delete().eq("id", inscricao.id);
    }
  }

  return NextResponse.json({ ok: true, enviados });
}
