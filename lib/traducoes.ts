/** A Perenual devolve tudo em inglês. Aqui viram termos de jardinagem em português. */

const LUZ: Record<string, string> = {
  "full sun": "Sol pleno",
  "full shade": "Sombra total",
  "part shade": "Meia-sombra",
  "part sun": "Sol parcial",
  "part sun/part shade": "Sol parcial ou meia-sombra",
  "sun-part shade": "De sol pleno a meia-sombra",
  filtered: "Luz filtrada",
  "deep shade": "Sombra densa",
};

const REGA: Record<string, string> = {
  frequent: "Frequente",
  average: "Moderada",
  minimum: "Pouca",
  none: "Quase nenhuma",
};

const CICLO: Record<string, string> = {
  perennial: "Perene",
  annual: "Anual",
  biennial: "Bienal",
  biannual: "Bienal",
  herbaceous: "Herbácea",
  "herbaceous perennial": "Perene herbácea",
};

const NIVEL: Record<string, string> = {
  easy: "Fácil",
  moderate: "Exige atenção",
  medium: "Exige atenção",
  "medium-high": "Exigente",
  difficult: "Difícil",
  high: "Difícil",
};

function traduzir(mapa: Record<string, string>, valor: string | null | undefined) {
  if (!valor) return null;
  return mapa[valor.trim().toLowerCase()] ?? valor;
}

export const traduzirLuz = (v: string | null | undefined) => traduzir(LUZ, v);
export const traduzirRega = (v: string | null | undefined) => traduzir(REGA, v);
export const traduzirCiclo = (v: string | null | undefined) => traduzir(CICLO, v);
export const traduzirNivel = (v: string | null | undefined) => traduzir(NIVEL, v);

/** Data ISO (2026-03-14) em texto curto: "14 de mar". */
export function dataCurta(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}

/** Data ISO em texto por extenso: "14 de março de 2026". */
export function dataLonga(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
