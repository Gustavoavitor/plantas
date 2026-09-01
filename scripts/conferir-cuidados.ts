/**
 * Passa casos reais pelo catálogo e pelo cálculo de rega, para conferir
 * se os números fazem sentido de verdade.
 *
 *   node scripts/conferir-cuidados.ts
 */
import { buscarCuidados, GENEROS, ESPECIES, TAMANHO_CATALOGO } from "../lib/catalogo.ts";
import { calcularIntervaloRega, calcularIntervaloAdubacao, estacaoDoAno } from "../lib/cuidados.ts";

const VERAO = new Date(2026, 0, 15); // 15 de janeiro
const INVERNO = new Date(2026, 6, 15); // 15 de julho

const PADRAO = { ambiente: "interno", luz: "luz_indireta", tamanho_vaso: "medio" } as const;

console.log(`Catálogo: ${TAMANHO_CATALOGO} entradas ` + `(${Object.keys(GENEROS).length} gêneros, ${Object.keys(ESPECIES).length} espécies)\n`);

// ------------------------------------------------------------------
console.log("── Casamento de nome ──");
const NOMES: Array<[string, string | null]> = [
  ["Monstera deliciosa", "Araceae"],
  ["Epipremnum aureum", "Araceae"],
  ["Ficus lyrata", "Moraceae"],
  ["Ficus elastica", "Moraceae"],
  ["Dracaena trifasciata", "Asparagaceae"],
  ["Nephrolepis exaltata", null],
  ["Phalaenopsis amabilis", "Orchidaceae"],
  ["Zamioculcas zamiifolia", "Araceae"],
  ["Calathea orbifolia", "Marantaceae"],
  ["Ocimum basilicum", "Lamiaceae"],
  ["Philodendron bipinnatifidum", "Araceae"],
  ["Mammillaria elongata", "Cactaceae"], // gênero ausente, família cobre
  ["Xerofita inventada", "Familiaceae"], // nada casa
];

for (const [nome, familia] of NOMES) {
  const c = buscarCuidados(nome, familia);
  const popular = c.entrada.nomes[0] ?? "—";
  console.log(
    `  ${nome.padEnd(30)} ${c.precisao.padEnd(8)} ${String(c.entrada.regaDias).padStart(2)}d  ${popular}`,
  );
}

// ------------------------------------------------------------------
console.log("\n── Rega ajustada por contexto (Monstera) ──");
const monstera = buscarCuidados("Monstera deliciosa", "Araceae").entrada;
const CENARIOS = [
  ["padrão, verão", PADRAO, VERAO],
  ["padrão, inverno", PADRAO, INVERNO],
  ["sol direto, vaso pequeno, verão", { ambiente: "externo", luz: "sol_direto", tamanho_vaso: "pequeno" }, VERAO],
  ["sombra, vaso grande, inverno", { ambiente: "interno", luz: "sombra", tamanho_vaso: "grande" }, INVERNO],
] as const;

for (const [rotulo, ctx, data] of CENARIOS) {
  const r = calcularIntervaloRega(monstera, ctx as never, data);
  console.log(`  ${rotulo.padEnd(34)} base ${r.base}d → ${String(r.dias).padStart(2)}d`);
}

// ------------------------------------------------------------------
console.log("\n── Extremos: a mesma regra em plantas opostas ──");
for (const nome of ["Adiantum raddianum", "Zamioculcas zamiifolia", "Mammillaria elongata"]) {
  const e = buscarCuidados(nome, nome.startsWith("Mammillaria") ? "Cactaceae" : null).entrada;
  const v = calcularIntervaloRega(e, PADRAO, VERAO).dias;
  const i = calcularIntervaloRega(e, PADRAO, INVERNO).dias;
  console.log(`  ${nome.padEnd(26)} verão ${String(v).padStart(2)}d  |  inverno ${String(i).padStart(2)}d`);
}

// ------------------------------------------------------------------
console.log("\n── Adubação ──");
console.log(`  verão   (${estacaoDoAno(VERAO)}):  ${JSON.stringify(calcularIntervaloAdubacao(monstera, VERAO))}`);
console.log(`  inverno (${estacaoDoAno(INVERNO)}): ${JSON.stringify(calcularIntervaloAdubacao(monstera, INVERNO))}`);

// ------------------------------------------------------------------
console.log("\n── Sanidade do catálogo ──");
let problemas = 0;
for (const [chave, e] of Object.entries(GENEROS)) {
  if (e.regaDias < 1 || e.regaDias > 40) {
    console.log(`  ! ${chave}: regaDias fora do razoável (${e.regaDias})`);
    problemas++;
  }
  if (e.nomes.length === 0) {
    console.log(`  ! ${chave}: sem nome popular`);
    problemas++;
  }
  if (e.dicas.length === 0) {
    console.log(`  ! ${chave}: sem dicas`);
    problemas++;
  }
  if (e.luz.length === 0) {
    console.log(`  ! ${chave}: sem luz`);
    problemas++;
  }
}
console.log(problemas === 0 ? "  nenhum problema encontrado" : `  ${problemas} problema(s)`);
