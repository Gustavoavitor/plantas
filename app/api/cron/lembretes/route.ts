import { NextResponse, type NextRequest } from "next/server";
import { buscarCuidados } from "@/lib/catalogo";
import {
  calcularIntervaloRega,
  ehViradaDeEstacao,
  estacaoDoAno,
  statusAdubacao,
  statusRega,
} from "@/lib/cuidados";
import { enviarAviso, type Aviso, type Inscricao } from "@/lib/push";
import { criarClienteAdmin } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Sem registro nenhum por mais tempo que isto, a planta sumiu do radar. */
const DIAS_PARA_SUMIDA = 30;

/** Um ano no mesmo vaso é quando vale considerar replantio. */
const DIAS_PARA_REPLANTIO = 365;

const NOME_ESTACAO = {
  verao: "verão",
  outono: "outono",
  inverno: "inverno",
  primavera: "primavera",
} as const;

const UM_DIA = 86_400_000;

type Pendencias = {
  regar: string[];
  adubar: string[];
  intervaloMudou: number;
  sumidas: string[];
  replantar: string[];
};

function novasPendencias(): Pendencias {
  return { regar: [], adubar: [], intervaloMudou: 0, sumidas: [], replantar: [] };
}

function diasDesde(iso: string | null, agora: number): number | null {
  if (!iso) return null;
  return Math.floor((agora - new Date(`${iso}T00:00:00Z`).getTime()) / UM_DIA);
}

/**
 * Roda uma vez por dia (Vercel Cron). Varre as plantas de todo mundo e
 * manda no máximo dois avisos por pessoa: um com as pendências do dia e,
 * quando for o caso, um segundo com o assunto da vez.
 *
 * As cadências são diferentes de propósito:
 *  - pendências de rega e adubação: todo dia
 *  - virada de estação: só no dia em que a estação muda
 *  - replantio: só na primavera, no primeiro dia do mês
 *  - plantas sumidas: só às segundas
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
    .select(
      "id, usuario_id, apelido, nome_cientifico, ambiente, luz, tamanho_vaso, ultima_rega, ultima_aduba, intervalo_rega_dias, intervalo_aduba_dias, criado_em",
    )
    .eq("arquivada", false);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const plantas = (plantasBrutas ?? []) as Planta[];

  const hoje = new Date();
  const agora = hoje.getTime();
  const estacao = estacaoDoAno(hoje);
  const virouEstacao = ehViradaDeEstacao(hoje);
  const ehSegunda = hoje.getDay() === 1;
  const janelaReplantio = estacao === "primavera" && hoje.getDate() === 1;

  // Última vez que a planta foi replantada, para o aviso anual.
  const { data: replantiosBrutos } = await admin
    .from("eventos_cuidado")
    .select("planta_id, data")
    .eq("tipo", "replantio")
    .order("data", { ascending: false });

  const ultimoReplantio = new Map<string, string>();
  for (const r of replantiosBrutos ?? []) {
    if (!ultimoReplantio.has(r.planta_id)) ultimoReplantio.set(r.planta_id, r.data);
  }

  const porUsuario = new Map<string, Pendencias>();
  const pegar = (id: string) => {
    const atual = porUsuario.get(id) ?? novasPendencias();
    porUsuario.set(id, atual);
    return atual;
  };

  for (const p of plantas) {
    const rega = statusRega(p);
    const aduba = statusAdubacao(p);

    // "sem_registro" entra também: planta cadastrada e nunca regada
    // é justamente a que corre mais risco de ser esquecida.
    const precisaRegar =
      rega.status === "atrasada" || rega.status === "hoje" || rega.status === "sem_registro";
    const precisaAdubar =
      p.intervalo_aduba_dias > 0 && (aduba.status === "atrasada" || aduba.status === "hoje");

    if (precisaRegar) pegar(p.usuario_id).regar.push(p.apelido);
    if (precisaAdubar) pegar(p.usuario_id).adubar.push(p.apelido);

    // --- virada de estação: o intervalo recomendado mudaria? ---
    if (virouEstacao) {
      const { entrada } = buscarCuidados(p.nome_cientifico);
      const sugerido = calcularIntervaloRega(
        entrada,
        { ambiente: p.ambiente, luz: p.luz, tamanho_vaso: p.tamanho_vaso },
        hoje,
      ).dias;
      if (sugerido !== p.intervalo_rega_dias) pegar(p.usuario_id).intervaloMudou++;
    }

    // --- sumiu do radar: nenhum cuidado registrado há muito tempo ---
    if (ehSegunda) {
      const ultimoCuidado = [p.ultima_rega, p.ultima_aduba]
        .filter((d): d is string => Boolean(d))
        .sort()
        .at(-1);

      const dias = diasDesde(ultimoCuidado ?? p.criado_em.slice(0, 10), agora);
      if (dias !== null && dias > DIAS_PARA_SUMIDA) {
        pegar(p.usuario_id).sumidas.push(p.apelido);
      }
    }

    // --- replantio anual, na primavera ---
    if (janelaReplantio) {
      const referencia = ultimoReplantio.get(p.id) ?? p.criado_em.slice(0, 10);
      const dias = diasDesde(referencia, agora);
      if (dias !== null && dias > DIAS_PARA_REPLANTIO) {
        pegar(p.usuario_id).replantar.push(p.apelido);
      }
    }
  }

  let enviados = 0;
  let expiradas = 0;

  for (const [usuarioId, pend] of porUsuario) {
    const avisos = montarAvisos(pend, estacao, virouEstacao);
    if (avisos.length === 0) continue;

    const { data } = await admin
      .from("inscricoes_push")
      .select("id, endpoint, p256dh, auth_key")
      .eq("usuario_id", usuarioId);

    const inscricoes = (data ?? []) as Inscricao[];
    if (inscricoes.length === 0) continue;

    for (const inscricao of inscricoes) {
      for (const aviso of avisos) {
        const r = await enviarAviso(inscricao, aviso);
        if (r === "enviado") enviados++;
        if (r === "expirada") {
          await admin.from("inscricoes_push").delete().eq("id", inscricao.id);
          expiradas++;
          break; // inscrição morta: não insiste com os outros avisos
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    estacao,
    virouEstacao,
    plantas: plantas.length,
    pessoasAvisadas: porUsuario.size,
    avisosEnviados: enviados,
    inscricoesExpiradas: expiradas,
  });
}

/** No máximo dois avisos: as pendências do dia e o assunto da vez. */
function montarAvisos(
  pend: Pendencias,
  estacao: keyof typeof NOME_ESTACAO,
  virouEstacao: boolean,
): Aviso[] {
  const avisos: Aviso[] = [];

  // 1. Pendências do dia.
  const { regar, adubar } = pend;
  if (regar.length > 0 || adubar.length > 0) {
    const partes: string[] = [];
    if (regar.length === 1) partes.push(`Regar ${regar[0]}`);
    else if (regar.length > 1) partes.push(`Regar ${regar.length} plantas`);

    if (adubar.length === 1) partes.push(`adubar ${adubar[0]}`);
    else if (adubar.length > 1) partes.push(`adubar ${adubar.length} plantas`);

    const nomes = [...regar, ...adubar];
    avisos.push({
      titulo: partes.join(" e "),
      corpo: nomes.length <= 3 ? nomes.join(", ") : "Abra o app para ver o que está pendente.",
      url: "/jardim",
      tag: "lembrete-diario",
    });
  }

  // 2. O assunto da vez, em ordem de importância.
  if (virouEstacao && pend.intervaloMudou > 0) {
    avisos.push({
      titulo: `Chegou o ${NOME_ESTACAO[estacao]}`,
      corpo:
        pend.intervaloMudou === 1
          ? "1 planta pede um intervalo de rega diferente agora. Abra e recalcule."
          : `${pend.intervaloMudou} plantas pedem um intervalo de rega diferente agora.`,
      url: "/jardim",
      tag: `estacao-${estacao}`,
    });
  } else if (pend.replantar.length > 0) {
    avisos.push({
      titulo: "Primavera é época de replantar",
      corpo:
        pend.replantar.length === 1
          ? `${pend.replantar[0]} está há mais de um ano no mesmo vaso.`
          : `${pend.replantar.length} plantas estão há mais de um ano no mesmo vaso.`,
      url: "/jardim",
      tag: "replantio-anual",
    });
  } else if (pend.sumidas.length > 0) {
    avisos.push({
      titulo: "Sumiram do radar",
      corpo:
        pend.sumidas.length === 1
          ? `${pend.sumidas[0]} está há mais de um mês sem registro. Ainda está com você?`
          : `${pend.sumidas.length} plantas estão há mais de um mês sem registro.`,
      url: "/jardim",
      tag: "sem-registro",
    });
  }

  return avisos;
}
