import { NextResponse, type NextRequest } from "next/server";
import { buscarCuidados, procurarPorNome } from "@/lib/catalogo";
import { buscarEspecies } from "@/lib/perenual";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

/**
 * GET /api/especie?cientifico=Monstera deliciosa → cuidados dessa espécie
 * GET /api/especie?q=costela-de-adao            → busca por nome
 *
 * A busca olha primeiro o catálogo local (nomes em português, resposta
 * imediata) e só recorre à Perenual para achar o nome científico de plantas
 * que o catálogo não cobre.
 */
export async function GET(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const termo = searchParams.get("q");
  const cientifico = searchParams.get("cientifico");
  const familia = searchParams.get("familia");

  if (cientifico) {
    return NextResponse.json({ cuidados: buscarCuidados(cientifico, familia) });
  }

  if (!termo || termo.trim().length < 2) {
    return NextResponse.json({ erro: "Informe q ou cientifico" }, { status: 400 });
  }

  const locais = procurarPorNome(termo.trim()).map((r) => ({
    nomeCientifico: r.nomeCientifico,
    nomeComum: r.nomes[0] ?? null,
    origem: "catalogo" as const,
  }));

  if (locais.length > 0) {
    return NextResponse.json({ resultados: locais });
  }

  // Nada no catálogo: a Perenual ainda serve para descobrir o nome
  // científico, e aí o catálogo tenta casar por gênero ou família.
  try {
    const remotos = await buscarEspecies(termo.trim());
    return NextResponse.json({
      resultados: remotos.slice(0, 10).map((r) => ({
        nomeCientifico: r.scientific_name?.[0] ?? null,
        nomeComum: r.common_name ?? null,
        origem: "perenual" as const,
      })),
    });
  } catch {
    // A Perenual é opcional aqui. Sem ela, apenas não há sugestões.
    return NextResponse.json({ resultados: [] });
  }
}
