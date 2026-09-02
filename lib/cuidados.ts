import type { Ambiente, Luz, Planta, TamanhoVaso } from "./tipos";

/**
 * O mínimo que precisamos saber sobre a espécie para montar o cronograma.
 * Vem do catálogo em `lib/catalogo.ts`.
 */
export type DadosEspecie = {
  rega?: string | null;
  regaDias?: number | null;
  toleraSeca?: boolean | null;
  ciclo?: string | null;
};

/** Intervalo-base de rega, em dias, quando só temos a classificação. */
const BASE_POR_CLASSE: Record<string, number> = {
  frequent: 3,
  average: 7,
  minimum: 14,
  none: 30,
};

export type Estacao = "verao" | "outono" | "inverno" | "primavera";

/**
 * Início de cada estação no hemisfério sul, como MMDD.
 *
 * Vai pelos solstícios e equinócios, não pelo mês cheio: até 22 de setembro
 * ainda é inverno no Brasil, embora setembro "pareça" primavera. A data exata
 * oscila um dia entre os anos; para decidir rega isso é irrelevante.
 */
const INICIO_ESTACAO = {
  verao: 1221, // 21 de dezembro
  outono: 320, // 20 de março
  inverno: 621, // 21 de junho
  primavera: 923, // 23 de setembro
} as const;

function comoMMDD(data: Date) {
  return (data.getMonth() + 1) * 100 + data.getDate();
}

/** Em que estação do hemisfério sul a data cai. */
export function estacaoDoAno(data = new Date()): Estacao {
  const hoje = comoMMDD(data);

  if (hoje >= INICIO_ESTACAO.verao || hoje < INICIO_ESTACAO.outono) return "verao";
  if (hoje < INICIO_ESTACAO.inverno) return "outono";
  if (hoje < INICIO_ESTACAO.primavera) return "inverno";
  return "primavera";
}

/** A estação que vem depois desta. */
export function proximaEstacao(atual: Estacao): Estacao {
  const ordem: Estacao[] = ["verao", "outono", "inverno", "primavera"];
  return ordem[(ordem.indexOf(atual) + 1) % 4];
}

/**
 * Verdadeiro quando a data marca o primeiro dia de uma estação nova.
 * É o gancho do aviso de virada, que só deve sair uma vez por estação.
 */
export function ehViradaDeEstacao(data = new Date()): boolean {
  const ontem = new Date(data);
  ontem.setDate(ontem.getDate() - 1);
  return estacaoDoAno(data) !== estacaoDoAno(ontem);
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
  especie: DadosEspecie | null,
  contexto: ContextoPlanta,
  data = new Date(),
): CalculoRega {
  const classe = especie?.rega?.toLowerCase() ?? "";
  const base = especie?.regaDias ?? BASE_POR_CLASSE[classe] ?? 7;

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

  if (especie?.toleraSeca) {
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
  especie: DadosEspecie | null,
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
      return "Sem registro";
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
