import type { Ambiente, Especie, Luz, Planta, TamanhoVaso } from "./tipos";

/**
 * Intervalo-base de rega, em dias, a partir da classificação da Perenual.
 * Usado só quando a API não devolve um benchmark numérico.
 */
const BASE_POR_CLASSE: Record<string, number> = {
  frequent: 3,
  average: 7,
  minimum: 14,
  none: 30,
};

/** Estações do hemisfério sul, pelo mês (0 = janeiro). */
export function estacaoDoAno(data = new Date()): "verao" | "outono" | "inverno" | "primavera" {
  const mes = data.getMonth();
  if (mes === 11 || mes <= 1) return "verao";
  if (mes >= 2 && mes <= 4) return "outono";
  if (mes >= 5 && mes <= 7) return "inverno";
  return "primavera";
}

const FATOR_ESTACAO = {
  verao: 0.8, // calor e dias longos: seca mais rápido
  outono: 1.0,
  inverno: 1.4, // planta desacelera, substrato demora a secar
  primavera: 0.9,
} as const;

const FATOR_LUZ: Record<Luz, number> = {
  sol_direto: 0.8,
  luz_indireta: 1.0,
  meia_sombra: 1.15,
  sombra: 1.35,
};

const FATOR_AMBIENTE: Record<Ambiente, number> = {
  externo: 0.85, // vento e sol evaporam mais
  varanda: 0.95,
  interno: 1.1, // ar parado, menos evaporação
};

const FATOR_VASO: Record<TamanhoVaso, number> = {
  pequeno: 0.8, // pouco substrato, seca rápido
  medio: 1.0,
  grande: 1.25,
  canteiro: 1.4,
};

export type ContextoPlanta = {
  ambiente: Ambiente;
  luz: Luz;
  tamanho_vaso: TamanhoVaso;
};

export type CalculoRega = {
  dias: number;
  base: number;
  motivos: string[];
};

/**
 * Calcula de quantos em quantos dias regar, partindo do dado botânico da
 * espécie e ajustando para as condições reais em que a planta vive.
 *
 * Os fatores são multiplicativos: cada condição estica ou encurta o intervalo.
 */
export function calcularIntervaloRega(
  especie: Pick<Especie, "rega" | "rega_dias" | "tolera_seca"> | null,
  contexto: ContextoPlanta,
  data = new Date(),
): CalculoRega {
  const classe = especie?.rega?.toLowerCase() ?? "";
  const base = especie?.rega_dias ?? BASE_POR_CLASSE[classe] ?? 7;

  const estacao = estacaoDoAno(data);
  const motivos: string[] = [];

  let fator = 1;

  fator *= FATOR_ESTACAO[estacao];
  if (estacao === "inverno") motivos.push("Inverno: o substrato demora mais para secar.");
  if (estacao === "verao") motivos.push("Verão: calor e dias longos secam a terra mais rápido.");

  fator *= FATOR_LUZ[contexto.luz];
  if (contexto.luz === "sol_direto") motivos.push("Sol direto aumenta a evaporação.");
  if (contexto.luz === "sombra") motivos.push("Na sombra a terra segura água por mais tempo.");

  fator *= FATOR_AMBIENTE[contexto.ambiente];
  if (contexto.ambiente === "interno") motivos.push("Dentro de casa o ar é mais parado.");
  if (contexto.ambiente === "externo") motivos.push("Área externa: vento e sol pedem rega mais frequente.");

  fator *= FATOR_VASO[contexto.tamanho_vaso];
  if (contexto.tamanho_vaso === "pequeno") motivos.push("Vaso pequeno tem pouca terra e seca rápido.");
  if (contexto.tamanho_vaso === "grande" || contexto.tamanho_vaso === "canteiro") {
    motivos.push("Muito substrato: a água dura mais.");
  }

  if (especie?.tolera_seca) {
    fator *= 1.2;
    motivos.push("Espécie tolerante à seca: errar para menos é mais seguro.");
  }

  const dias = Math.min(120, Math.max(1, Math.round(base * fator)));
  return { dias, base, motivos };
}

/**
 * Intervalo de adubação. Devolve 0 quando é para pausar
 * (a maioria das plantas não deve ser adubada no inverno).
 */
export function calcularIntervaloAdubacao(
  especie: Pick<Especie, "ciclo" | "rega"> | null,
  data = new Date(),
): { dias: number; motivo: string } {
  const estacao = estacaoDoAno(data);

  if (estacao === "inverno") {
    return {
      dias: 0,
      motivo:
        "No inverno a planta praticamente para de crescer. Adubar agora só acumula sal no substrato e queima a raiz.",
    };
  }

  const cresceRapido = especie?.rega?.toLowerCase() === "frequent";
  if (estacao === "verao" || estacao === "primavera") {
    return {
      dias: cresceRapido ? 21 : 30,
      motivo: "Estação de crescimento: adubação regular sustenta folhas e flores novas.",
    };
  }

  return {
    dias: 45,
    motivo: "Outono: espace a adubação conforme o crescimento desacelera.",
  };
}

// ------------------------------------------------------------------
// Status do dia a dia
// ------------------------------------------------------------------

export type StatusCuidado = {
  status: "sem_registro" | "atrasada" | "hoje" | "em_dia";
  diasDesde: number | null;
  diasRestantes: number | null;
  proximaData: string | null;
};

const UM_DIA = 86_400_000;

/** Normaliza para meia-noite local, para comparar dias sem sofrer com fuso. */
function meiaNoite(d: Date | string): Date {
  const data = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function statusCuidado(
  ultima: string | null,
  intervaloDias: number,
  hoje = new Date(),
): StatusCuidado {
  if (intervaloDias <= 0) {
    return { status: "em_dia", diasDesde: null, diasRestantes: null, proximaData: null };
  }
  if (!ultima) {
    return { status: "sem_registro", diasDesde: null, diasRestantes: null, proximaData: null };
  }

  const inicio = meiaNoite(ultima);
  const agora = meiaNoite(hoje);
  const diasDesde = Math.round((agora.getTime() - inicio.getTime()) / UM_DIA);
  const diasRestantes = intervaloDias - diasDesde;

  const proxima = new Date(inicio.getTime() + intervaloDias * UM_DIA);
  const proximaData = proxima.toISOString().slice(0, 10);

  const status = diasRestantes < 0 ? "atrasada" : diasRestantes === 0 ? "hoje" : "em_dia";
  return { status, diasDesde, diasRestantes, proximaData };
}

/** Status de rega de uma planta já salva. */
export function statusRega(planta: Pick<Planta, "ultima_rega" | "intervalo_rega_dias">, hoje = new Date()) {
  return statusCuidado(planta.ultima_rega, planta.intervalo_rega_dias, hoje);
}

export function statusAdubacao(
  planta: Pick<Planta, "ultima_aduba" | "intervalo_aduba_dias">,
  hoje = new Date(),
) {
  return statusCuidado(planta.ultima_aduba, planta.intervalo_aduba_dias, hoje);
}

/** Ordena a lista do jardim: o que está mais atrasado aparece primeiro. */
export function ordenarPorUrgencia<T extends Pick<Planta, "ultima_rega" | "intervalo_rega_dias" | "apelido">>(
  plantas: T[],
  hoje = new Date(),
): T[] {
  const peso = (p: T) => {
    const s = statusRega(p, hoje);
    if (s.status === "sem_registro") return -1000;
    return s.diasRestantes ?? 0;
  };
  return [...plantas].sort((a, b) => peso(a) - peso(b) || a.apelido.localeCompare(b.apelido, "pt-BR"));
}

/** Texto curto para o card do jardim. */
export function frasePendencia(s: StatusCuidado): string {
  switch (s.status) {
    case "sem_registro":
      return "Sem registro de rega";
    case "atrasada": {
      const d = Math.abs(s.diasRestantes!);
      return d === 1 ? "Atrasada 1 dia" : `Atrasada ${d} dias`;
    }
    case "hoje":
      return "Regar hoje";
    default: {
      const d = s.diasRestantes!;
      return d === 1 ? "Regar amanhã" : `Regar em ${d} dias`;
    }
  }
}
