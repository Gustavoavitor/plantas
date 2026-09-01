/**
 * Códigos de tempo da Open-Meteo (padrão WMO) traduzidos para os poucos
 * ícones que o app desenha. Agrupar é proposital: a diferença entre
 * "garoa leve" e "garoa moderada" não muda nada para quem cuida de planta.
 */
export type TipoClima =
  | "limpo"
  | "poucas_nuvens"
  | "nublado"
  | "neblina"
  | "chuva"
  | "tempestade"
  | "neve";

export type Clima = {
  temperatura: number;
  tipo: TipoClima;
  descricao: string;
  ehDia: boolean;
};

const POR_CODIGO: Array<{ codigos: number[]; tipo: TipoClima; descricao: string }> = [
  { codigos: [0], tipo: "limpo", descricao: "Céu limpo" },
  { codigos: [1, 2], tipo: "poucas_nuvens", descricao: "Parcialmente nublado" },
  { codigos: [3], tipo: "nublado", descricao: "Nublado" },
  { codigos: [45, 48], tipo: "neblina", descricao: "Neblina" },
  { codigos: [51, 53, 55, 56, 57], tipo: "chuva", descricao: "Garoa" },
  { codigos: [61, 63, 65, 66, 67, 80, 81, 82], tipo: "chuva", descricao: "Chuva" },
  { codigos: [71, 73, 75, 77, 85, 86], tipo: "neve", descricao: "Neve" },
  { codigos: [95, 96, 99], tipo: "tempestade", descricao: "Tempestade" },
];

export function interpretarCodigo(codigo: number): { tipo: TipoClima; descricao: string } {
  const achado = POR_CODIGO.find((g) => g.codigos.includes(codigo));
  return achado ?? { tipo: "nublado", descricao: "Tempo fechado" };
}

/**
 * Um comentário curto ligando o tempo ao cuidado com as plantas.
 * É o que justifica o clima estar no app, em vez de ser só enfeite.
 */
export function dicaDoTempo(clima: Clima): string | null {
  if (clima.tipo === "chuva" || clima.tipo === "tempestade") {
    return "Choveu? Quem está na varanda ou no quintal talvez já tenha bebido.";
  }
  if (clima.temperatura >= 30) {
    return "Calor forte: o substrato seca mais rápido que o previsto.";
  }
  if (clima.temperatura <= 10) {
    return "Frio: segure a rega, a planta está bebendo pouco.";
  }
  return null;
}
