"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buscarCuidados } from "@/lib/catalogo";
import { calcularIntervaloAdubacao, calcularIntervaloRega } from "@/lib/cuidados";
import { diagnosticar } from "@/lib/diagnostico";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Ambiente, Luz, TamanhoVaso, TipoEvento } from "@/lib/tipos";

async function exigirUsuario() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

// ------------------------------------------------------------------
// Plantas
// ------------------------------------------------------------------

export type DadosNovaPlanta = {
  apelido: string;
  nomeCientifico: string | null;
  nomeComum: string | null;
  fotoUrl: string | null;
  ambiente: Ambiente;
  luz: Luz;
  tamanhoVaso: TamanhoVaso;
  intervaloRegaDias: number;
  intervaloAdubaDias: number;
  jaRegouHoje: boolean;
  notas: string | null;
};

export async function criarPlanta(dados: DadosNovaPlanta) {
  const { supabase, user } = await exigirUsuario();

  const apelido = dados.apelido.trim();
  if (!apelido) return { erro: "Dê um apelido para a planta." };

  const { data, error } = await supabase
    .from("plantas")
    .insert({
      usuario_id: user.id,
      apelido,
      nome_cientifico: dados.nomeCientifico,
      nome_comum: dados.nomeComum,
      foto_url: dados.fotoUrl,
      ambiente: dados.ambiente,
      luz: dados.luz,
      tamanho_vaso: dados.tamanhoVaso,
      intervalo_rega_dias: dados.intervaloRegaDias,
      intervalo_aduba_dias: dados.intervaloAdubaDias,
      notas: dados.notas,
    })
    .select("id")
    .single();

  if (error) return { erro: error.message };

  if (dados.jaRegouHoje) {
    await supabase.from("eventos_cuidado").insert({
      planta_id: data.id,
      usuario_id: user.id,
      tipo: "rega",
      observacao: "Rega registrada ao cadastrar a planta.",
    });
  }

  if (dados.fotoUrl) {
    await supabase.from("fotos").insert({
      planta_id: data.id,
      usuario_id: user.id,
      url: dados.fotoUrl,
      tipo: "registro",
      legenda: "Primeira foto",
    });
  }

  revalidatePath("/jardim");
  return { id: data.id as string };
}

export type DadosEdicao = {
  id: string;
  apelido: string;
  ambiente: Ambiente;
  luz: Luz;
  tamanhoVaso: TamanhoVaso;
  intervaloRegaDias: number;
  intervaloAdubaDias: number;
  notas: string | null;
};

export async function atualizarPlanta(dados: DadosEdicao) {
  const { supabase } = await exigirUsuario();

  const { error } = await supabase
    .from("plantas")
    .update({
      apelido: dados.apelido.trim(),
      ambiente: dados.ambiente,
      luz: dados.luz,
      tamanho_vaso: dados.tamanhoVaso,
      intervalo_rega_dias: dados.intervaloRegaDias,
      intervalo_aduba_dias: dados.intervaloAdubaDias,
      notas: dados.notas,
    })
    .eq("id", dados.id);

  if (error) return { erro: error.message };

  revalidatePath("/jardim");
  revalidatePath(`/planta/${dados.id}`);
  return { ok: true };
}

/**
 * Recalcula os intervalos a partir da espécie e das condições atuais.
 * Útil na virada de estação: o que valia no verão não vale no inverno.
 */
export async function recalcularCuidados(plantaId: string) {
  const { supabase } = await exigirUsuario();

  const { data: planta } = await supabase
    .from("plantas")
    .select("id, nome_cientifico, ambiente, luz, tamanho_vaso")
    .eq("id", plantaId)
    .single();

  if (!planta) return { erro: "Planta não encontrada." };

  const { entrada } = buscarCuidados(planta.nome_cientifico);

  const rega = calcularIntervaloRega(entrada, {
    ambiente: planta.ambiente,
    luz: planta.luz,
    tamanho_vaso: planta.tamanho_vaso,
  });
  const aduba = calcularIntervaloAdubacao(entrada);

  await supabase
    .from("plantas")
    .update({ intervalo_rega_dias: rega.dias, intervalo_aduba_dias: aduba.dias })
    .eq("id", plantaId);

  revalidatePath(`/planta/${plantaId}`);
  revalidatePath("/jardim");
  return { ok: true, rega: rega.dias, adubacao: aduba.dias, motivos: rega.motivos, motivoAduba: aduba.motivo };
}

export async function arquivarPlanta(plantaId: string) {
  const { supabase } = await exigirUsuario();
  await supabase.from("plantas").update({ arquivada: true }).eq("id", plantaId);
  revalidatePath("/jardim");
  redirect("/jardim");
}

export async function desarquivarPlanta(plantaId: string) {
  const { supabase } = await exigirUsuario();
  await supabase.from("plantas").update({ arquivada: false }).eq("id", plantaId);
  revalidatePath("/jardim");
  return { ok: true };
}

// ------------------------------------------------------------------
// Cuidados
// ------------------------------------------------------------------

export async function registrarCuidado(
  plantaId: string,
  tipo: TipoEvento,
  observacao?: string | null,
  data?: string | null,
) {
  const { supabase, user } = await exigirUsuario();

  const { error } = await supabase.from("eventos_cuidado").insert({
    planta_id: plantaId,
    usuario_id: user.id,
    tipo,
    observacao: observacao?.trim() || null,
    ...(data ? { data } : {}),
  });

  if (error) return { erro: error.message };

  revalidatePath("/jardim");
  revalidatePath(`/planta/${plantaId}`);
  return { ok: true };
}

export async function apagarEvento(eventoId: string, plantaId: string) {
  const { supabase } = await exigirUsuario();
  await supabase.from("eventos_cuidado").delete().eq("id", eventoId);
  revalidatePath(`/planta/${plantaId}`);
  return { ok: true };
}

export async function adicionarFoto(plantaId: string, url: string, legenda?: string | null) {
  const { supabase, user } = await exigirUsuario();

  await supabase.from("fotos").insert({
    planta_id: plantaId,
    usuario_id: user.id,
    url,
    tipo: "registro",
    legenda: legenda?.trim() || null,
  });

  // A foto mais recente vira a capa da planta.
  await supabase.from("plantas").update({ foto_url: url }).eq("id", plantaId);

  revalidatePath(`/planta/${plantaId}`);
  revalidatePath("/jardim");
  return { ok: true };
}

// ------------------------------------------------------------------
// Diagnóstico
// ------------------------------------------------------------------

export async function rodarDiagnostico(plantaId: string, sintomas: string[], fotoUrl?: string | null) {
  const { supabase, user } = await exigirUsuario();

  const { data: planta } = await supabase
    .from("plantas")
    .select("ultima_rega, intervalo_rega_dias")
    .eq("id", plantaId)
    .single();

  let diasDesdeRega: number | null = null;
  if (planta?.ultima_rega) {
    const ultima = new Date(`${planta.ultima_rega}T00:00:00`);
    diasDesdeRega = Math.round((Date.now() - ultima.getTime()) / 86_400_000);
  }

  const resultado = diagnosticar(sintomas, {
    diasDesdeRega,
    intervaloRega: planta?.intervalo_rega_dias ?? null,
  });

  await supabase.from("diagnosticos").insert({
    planta_id: plantaId,
    usuario_id: user.id,
    sintomas,
    foto_url: fotoUrl ?? null,
    resultado,
  });

  revalidatePath(`/planta/${plantaId}`);
  return resultado;
}

// ------------------------------------------------------------------
// Jardins (locais)
// ------------------------------------------------------------------

export async function criarJardim(nome: string, local: string | null) {
  const { supabase, user } = await exigirUsuario();

  const limpo = nome.trim();
  if (!limpo) return { erro: "Dê um nome ao jardim." };

  const { data, error } = await supabase
    .from("jardins")
    .insert({ usuario_id: user.id, nome: limpo, local: local?.trim() || null })
    .select("id")
    .single();

  if (error) return { erro: traduzirErroJardins(error.message) };

  revalidatePath("/jardins");
  return { id: data.id as string };
}

export async function renomearJardim(id: string, nome: string, local: string | null) {
  const { supabase } = await exigirUsuario();

  const limpo = nome.trim();
  if (!limpo) return { erro: "Dê um nome ao jardim." };

  const { error } = await supabase
    .from("jardins")
    .update({ nome: limpo, local: local?.trim() || null })
    .eq("id", id);

  if (error) return { erro: traduzirErroJardins(error.message) };

  revalidatePath("/jardins");
  revalidatePath(`/jardins/${id}`);
  return { ok: true };
}

/** Apagar o jardim não apaga as plantas: elas voltam a ficar sem lugar. */
export async function apagarJardim(id: string) {
  const { supabase } = await exigirUsuario();
  const { error } = await supabase.from("jardins").delete().eq("id", id);
  if (error) return { erro: traduzirErroJardins(error.message) };

  revalidatePath("/jardins");
  revalidatePath("/jardim");
  return { ok: true };
}

export async function moverPlanta(plantaId: string, jardimId: string | null) {
  const { supabase } = await exigirUsuario();

  const { error } = await supabase
    .from("plantas")
    .update({ jardim_id: jardimId })
    .eq("id", plantaId);

  if (error) return { erro: traduzirErroJardins(error.message) };

  revalidatePath("/jardins");
  revalidatePath("/jardim");
  revalidatePath(`/planta/${plantaId}`);
  return { ok: true };
}

/** A migração dos jardins é separada; sem ela o erro do Postgres é críptico. */
function traduzirErroJardins(mensagem: string) {
  if (/jardins|jardim_id/i.test(mensagem) && /does not exist|schema cache/i.test(mensagem)) {
    return "Os jardins ainda não existem no banco. Rode supabase/migracao-002-jardins.sql no SQL Editor do Supabase.";
  }
  return mensagem;
}

// ------------------------------------------------------------------
// Perfil
// ------------------------------------------------------------------

export async function salvarPerfil(nome: string, tituloJardim: string | null) {
  const { supabase, user } = await exigirUsuario();

  const { error } = await supabase
    .from("perfis")
    .upsert({
      id: user.id,
      nome: nome.trim() || null,
      titulo_jardim: tituloJardim?.trim() || null,
    });

  if (error) {
    if (/titulo_jardim/i.test(error.message)) {
      return {
        erro: "Rode supabase/migracao-002-jardins.sql no Supabase para poder personalizar o título.",
      };
    }
    return { erro: error.message };
  }

  revalidatePath("/ajustes");
  revalidatePath("/jardim");
  return { ok: true };
}
