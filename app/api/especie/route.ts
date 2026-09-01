import { NextResponse, type NextRequest } from "next/server";
import { buscarEspecies, detalhesEspecie, especiePorNomeCientifico } from "@/lib/perenual";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

/**
 * GET /api/especie?q=costela-de-adao   → busca por nome
 * GET /api/especie?id=123              → detalhes de uma espécie
 * GET /api/especie?cientifico=Monstera deliciosa → ponte Pl@ntNet → Perenual
 */
export async function GET(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const termo = searchParams.get("q");
  const cientifico = searchParams.get("cientifico");

  try {
    if (id) {
      const especie = await detalhesEspecie(Number(id));
      return NextResponse.json({ especie });
    }

    if (cientifico) {
      const especie = await especiePorNomeCientifico(cientifico);
      return NextResponse.json({ especie });
    }

    if (termo && termo.trim().length >= 2) {
      const resultados = await buscarEspecies(termo.trim());
      return NextResponse.json({
        resultados: resultados.slice(0, 12).map((r) => ({
          id: r.id,
          nomeComum: r.common_name ?? null,
          nomeCientifico: r.scientific_name?.[0] ?? null,
          imagem: r.default_image?.thumbnail ?? r.default_image?.small_url ?? null,
        })),
      });
    }

    return NextResponse.json({ erro: "Informe q, id ou cientifico" }, { status: 400 });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha na consulta";
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
