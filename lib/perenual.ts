/**
 * Cliente da Perenual — hoje com papel bem pequeno.
 *
 * O plano gratuito devolve apenas taxonomia: nome científico, nome comum,
 * família e gênero. Rega, luz, ciclo e nível de cuidado só no plano pago
 * (`species/details` e `species-care-guide-list` respondem
 * "Please Upgrade Plan"). Por isso os cuidados vivem em `lib/catalogo.ts`.
 *
 * O que sobrou de útil aqui: quando alguém procura pelo nome uma planta que
 * o catálogo não cobre, a Perenual ajuda a descobrir o nome científico — e
 * aí o catálogo tenta casar por gênero ou família.
 */

const V2 = "https://perenual.com/api/v2";

export type ItemPerenual = {
  id: number;
  common_name?: string | null;
  scientific_name?: string[] | null;
  family?: string | null;
  genus?: string | null;
};

/** Busca espécies por nome. Devolve lista vazia se a API falhar. */
export async function buscarEspecies(termo: string): Promise<ItemPerenual[]> {
  const chave = process.env.PERENUAL_API_KEY;
  if (!chave) return [];

  const url = `${V2}/species-list?key=${chave}&q=${encodeURIComponent(termo)}`;

  const r = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!r.ok) return [];

  const dados = await r.json().catch(() => null);
  const lista: ItemPerenual[] = dados?.data ?? [];
  return lista.filter((e) => typeof e.id === "number");
}
