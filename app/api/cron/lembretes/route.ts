import { NextResponse, type NextRequest } from "next/server";
import { statusAdubacao, statusRega } from "@/lib/cuidados";
import { enviarAviso, type Inscricao } from "@/lib/push";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Roda uma vez por dia (Vercel Cron). Varre as plantas de todo mundo,
 * vê quem está atrasado e manda uma notificação por pessoa — não uma
 * por planta, para não virar spam.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");

  // A Vercel envia "Bearer <CRON_SECRET>" automaticamente nos cron jobs.
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const admin = criarClienteAdmin();

  const { data: plantasBrutas, error } = await admin
    .from("plantas")
    .select("id, usuario_id, apelido, ultima_rega, ultima_aduba, intervalo_rega_dias, intervalo_aduba_dias")
    .eq("arquivada", false);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const plantas = (plantasBrutas ?? []) as Planta[];

  // Agrupa o que está pendente por usuário.
  const pendentesPorUsuario = new Map<string, { regar: string[]; adubar: string[] }>();

  for (const p of plantas) {
    const rega = statusRega(p);
    const aduba = statusAdubacao(p);

    // "sem_registro" entra também: planta cadastrada e nunca regada
    // é justamente a que corre mais risco de ser esquecida.
    const precisaRegar =
      rega.status === "atrasada" || rega.status === "hoje" || rega.status === "sem_registro";
    const precisaAdubar =
      p.intervalo_aduba_dias > 0 && (aduba.status === "atrasada" || aduba.status === "hoje");

    if (!precisaRegar && !precisaAdubar) continue;

    const atual = pendentesPorUsuario.get(p.usuario_id) ?? { regar: [], adubar: [] };
    if (precisaRegar) atual.regar.push(p.apelido);
    if (precisaAdubar) atual.adubar.push(p.apelido);
    pendentesPorUsuario.set(p.usuario_id, atual);
  }

  let avisados = 0;
  let expiradas = 0;

  for (const [usuarioId, pendencias] of pendentesPorUsuario) {
    const { data } = await admin
      .from("inscricoes_push")
      .select("id, endpoint, p256dh, auth_key")
      .eq("usuario_id", usuarioId);

    const inscricoes = (data ?? []) as Inscricao[];
    if (inscricoes.length === 0) continue;

    const aviso = montarAviso(pendencias);

    for (const inscricao of inscricoes) {
      const r = await enviarAviso(inscricao, aviso);
      if (r === "enviado") avisados++;
      if (r === "expirada") {
        await admin.from("inscricoes_push").delete().eq("id", inscricao.id);
        expiradas++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    plantas: plantas.length,
    pessoasComPendencia: pendentesPorUsuario.size,
    avisosEnviados: avisados,
    inscricoesExpiradas: expiradas,
  });
}

function montarAviso({ regar, adubar }: { regar: string[]; adubar: string[] }) {
  const partes: string[] = [];

  if (regar.length === 1) partes.push(`Regar ${regar[0]}`);
  else if (regar.length > 1) partes.push(`Regar ${regar.length} plantas`);

  if (adubar.length === 1) partes.push(`adubar ${adubar[0]}`);
  else if (adubar.length > 1) partes.push(`adubar ${adubar.length} plantas`);

  const corpo =
    regar.length + adubar.length <= 3
      ? [...regar, ...adubar].join(", ")
      : partes.join(" e ");

  return {
    titulo: partes.join(" e ") || "Suas plantas precisam de você",
    corpo: corpo || "Abra o app para ver o que está pendente.",
    url: "/jardim",
    tag: "lembrete-diario",
  };
}
