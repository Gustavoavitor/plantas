import { criarClienteAdmin } from "./supabase/servidor";
import type { Especie } from "./tipos";

const V2 = "https://perenual.com/api/v2";
const V1 = "https://perenual.com/api";

/** Quantos dias o cache de uma espécie vale antes de consultarmos de novo. */
const VALIDADE_CACHE_DIAS = 90;

type ItemLista = {
  id: number;
  common_name?: string | null;
  scientific_name?: string[] | null;
  cycle?: string | null;
  watering?: string | null;
  sunlight?: string[] | null;
  default_image?: { thumbnail?: string; small_url?: string; regular_url?: string } | null;
};

type Detalhes = ItemLista & {
  description?: string | null;
  indoor?: boolean | null;
  drought_tolerant?: boolean | null;
  care_level?: string | null;
  poisonous_to_pets?: boolean | number | null;
  watering_general_benchmark?: { value?: string | number; unit?: string } | null;
};

function chave(): string {
  const k = process.env.PERENUAL_API_KEY;
  if (!k) throw new Error("PERENUAL_API_KEY não configurada");
  return k;
}

/**
 * Converte o benchmark da Perenual ("5-7", unit "days") em um número de dias.
 * Quando vem em semanas, multiplica. Devolve null se não der para interpretar.
 */
export function benchmarkParaDias(
  bm: { value?: string | number; unit?: string } | null | undefined,
): number | null {
  if (!bm?.value) return null;

  const texto = String(bm.value);
  const numeros = texto.match(/\d+(?:[.,]\d+)?/g);
  if (!numeros || numeros.length === 0) return null;

  const valores = numeros.map((n) => parseFloat(n.replace(",", ".")));
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  if (!Number.isFinite(media) || media <= 0) return null;

  const unidade = (bm.unit ?? "days").toLowerCase();
  const emDias = unidade.startsWith("week")
    ? media * 7
    : unidade.startsWith("hour")
      ? media / 24
      : media;

  return Math.min(120, Math.max(1, Math.round(emDias)));
}

async function pegarJson(url: string) {
  const r = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (r.status === 429) {
    throw new Error("Cota diária da Perenual esgotada. Os dados salvos continuam funcionando.");
  }
  if (!r.ok) return null;
  return r.json();
}

/** Busca espécies por nome (científico ou popular) no catálogo da Perenual. */
export async function buscarEspecies(termo: string): Promise<ItemLista[]> {
  const url = `${V2}/species-list?key=${chave()}&q=${encodeURIComponent(termo)}`;
  const dados = await pegarJson(url);
  const lista: ItemLista[] = dados?.data ?? [];
  return lista.filter((e) => typeof e.id === "number");
}

/** Normaliza a resposta da Perenual para o formato que guardamos no banco. */
function normalizar(d: Detalhes): Omit<Especie, "id"> & { id: number; dados: unknown } {
  const cientifico = d.scientific_name?.[0] ?? d.common_name ?? "Desconhecida";

  return {
    id: d.id,
    nome_cientifico: cientifico,
    nome_comum: d.common_name ?? null,
    ciclo: d.cycle ?? null,
    rega: d.watering ?? null,
    rega_dias: benchmarkParaDias(d.watering_general_benchmark),
    luz: d.sunlight ?? null,
    interno: d.indoor ?? null,
    tolera_seca: d.drought_tolerant ?? null,
    nivel_cuidado: d.care_level ?? null,
    toxica_animais:
      d.poisonous_to_pets === null || d.poisonous_to_pets === undefined
        ? null
        : Boolean(Number(d.poisonous_to_pets)),
    descricao: d.description ?? null,
    imagem_url: d.default_image?.regular_url ?? d.default_image?.small_url ?? null,
    dados: d,
  };
}

/**
 * Busca os detalhes de uma espécie, usando o cache do Supabase primeiro.
 * Isso economiza a cota gratuita da Perenual, que é bem apertada.
 */
export async function detalhesEspecie(id: number): Promise<Especie | null> {
  const admin = criarClienteAdmin();

  const { data: emCache } = await admin.from("especies").select("*").eq("id", id).maybeSingle();

  if (emCache) {
    const idade = Date.now() - new Date(emCache.atualizado_em).getTime();
    if (idade < VALIDADE_CACHE_DIAS * 86_400_000) return emCache as Especie;
  }

  let bruto = await pegarJson(`${V2}/species/details/${id}?key=${chave()}`);
  if (!bruto?.id) {
    // Algumas espécies só existem na v1 da API.
    bruto = await pegarJson(`${V1}/species/details/${id}?key=${chave()}`);
  }

  // Sem resposta da API: se temos algo velho no cache, é melhor que nada.
  if (!bruto?.id) return (emCache as Especie) ?? null;

  const registro = normalizar(bruto as Detalhes);
  const { data: salvo } = await admin
    .from("especies")
    .upsert({ ...registro, atualizado_em: new Date().toISOString() })
    .select()
    .single();

  return (salvo as Especie) ?? (registro as unknown as Especie);
}

/**
 * Pega o nome científico vindo da Pl@ntNet e encontra a espécie
 * correspondente na Perenual. É a ponte entre as duas APIs.
 */
export async function especiePorNomeCientifico(nomeCientifico: string): Promise<Especie | null> {
  const admin = criarClienteAdmin();

  const { data: emCache } = await admin
    .from("especies")
    .select("*")
    .ilike("nome_cientifico", nomeCientifico)
    .maybeSingle();
  if (emCache) return emCache as Especie;

  const resultados = await buscarEspecies(nomeCientifico);
  if (resultados.length === 0) {
    // Tenta só o gênero: "Monstera deliciosa" -> "Monstera".
    const genero = nomeCientifico.split(" ")[0];
    if (genero && genero !== nomeCientifico) {
      const porGenero = await buscarEspecies(genero);
      if (porGenero.length > 0) return detalhesEspecie(porGenero[0].id);
    }
    return null;
  }

  // Prefere o resultado cujo nome científico bate exatamente.
  const alvo = nomeCientifico.toLowerCase();
  const exato = resultados.find((r) =>
    (r.scientific_name ?? []).some((n) => n.toLowerCase().startsWith(alvo)),
  );

  return detalhesEspecie((exato ?? resultados[0]).id);
}
