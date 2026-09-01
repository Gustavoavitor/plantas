import type { PalpiteEspecie } from "./tipos";

const BASE = "https://my-api.plantnet.org/v2/identify/all";

/** Órgão da planta que aparece na foto — melhora bastante a precisão. */
export type Orgao = "auto" | "leaf" | "flower" | "fruit" | "bark";

type RespostaPlantNet = {
  results?: Array<{
    score: number;
    species: {
      scientificNameWithoutAuthor?: string;
      scientificName?: string;
      commonNames?: string[];
      family?: { scientificNameWithoutAuthor?: string };
    };
    images?: Array<{ url?: { m?: string; s?: string; o?: string } }>;
  }>;
};

/**
 * Identifica a espécie a partir de uma ou mais fotos.
 * A Pl@ntNet aceita até 5 imagens por consulta — quanto mais ângulos,
 * melhor o palpite.
 */
export async function identificarPlanta(
  imagens: Array<{ arquivo: Blob; nome: string; orgao: Orgao }>,
): Promise<PalpiteEspecie[]> {
  const chave = process.env.PLANTNET_API_KEY;
  if (!chave) throw new Error("PLANTNET_API_KEY não configurada");
  if (imagens.length === 0) throw new Error("Envie ao menos uma foto");

  const form = new FormData();
  for (const { arquivo, nome, orgao } of imagens.slice(0, 5)) {
    form.append("images", arquivo, nome);
    form.append("organs", orgao);
  }

  const url = new URL(BASE);
  url.searchParams.set("api-key", chave);
  url.searchParams.set("include-related-images", "true");
  url.searchParams.set("lang", "pt");
  url.searchParams.set("nb-results", "5");

  const resposta = await fetch(url, { method: "POST", body: form });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    if (resposta.status === 404) {
      // A Pl@ntNet devolve 404 quando não reconhece nada na imagem.
      return [];
    }
    if (resposta.status === 429) {
      throw new Error("Cota diária da Pl@ntNet esgotada (500 identificações). Tente amanhã.");
    }
    throw new Error(`Pl@ntNet respondeu ${resposta.status}: ${corpo.slice(0, 200)}`);
  }

  const dados = (await resposta.json()) as RespostaPlantNet;

  return (dados.results ?? []).slice(0, 5).map((r) => ({
    nomeCientifico:
      r.species.scientificNameWithoutAuthor ?? r.species.scientificName ?? "Desconhecida",
    nomesComuns: r.species.commonNames ?? [],
    familia: r.species.family?.scientificNameWithoutAuthor ?? null,
    confianca: r.score,
    imagemReferencia: r.images?.[0]?.url?.m ?? r.images?.[0]?.url?.s ?? null,
  }));
}
