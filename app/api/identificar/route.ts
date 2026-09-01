import { NextResponse, type NextRequest } from "next/server";
import { especiePorNomeCientifico } from "@/lib/perenual";
import { identificarPlanta, type Orgao } from "@/lib/plantnet";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";
export const maxDuration = 30;

const ORGAOS_VALIDOS: Orgao[] = ["auto", "leaf", "flower", "fruit", "bark"];
const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8 MB por foto

/**
 * Recebe as fotos, identifica a espécie na Pl@ntNet e já busca os dados de
 * cultivo correspondentes na Perenual. As chaves das APIs ficam só aqui,
 * no servidor — nunca chegam ao navegador.
 */
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ erro: "Envio inválido" }, { status: 400 });
  }

  const arquivos = form.getAll("imagens").filter((v): v is File => v instanceof File);
  if (arquivos.length === 0) {
    return NextResponse.json({ erro: "Envie ao menos uma foto" }, { status: 400 });
  }

  for (const arquivo of arquivos) {
    if (arquivo.size > TAMANHO_MAXIMO) {
      return NextResponse.json({ erro: "Foto muito grande (máximo 8 MB)" }, { status: 413 });
    }
    if (!arquivo.type.startsWith("image/")) {
      return NextResponse.json({ erro: "Envie apenas imagens" }, { status: 400 });
    }
  }

  const orgaosBrutos = form.getAll("orgaos").map(String);

  const imagens = arquivos.slice(0, 5).map((arquivo, i) => {
    const bruto = orgaosBrutos[i] as Orgao | undefined;
    return {
      arquivo,
      nome: arquivo.name || `foto-${i}.jpg`,
      orgao: bruto && ORGAOS_VALIDOS.includes(bruto) ? bruto : ("auto" as Orgao),
    };
  });

  try {
    const palpites = await identificarPlanta(imagens);

    if (palpites.length === 0) {
      return NextResponse.json({
        palpites: [],
        especie: null,
        aviso:
          "Não reconheci a planta. Tente uma foto mais próxima de uma folha isolada, com boa luz e fundo limpo.",
      });
    }

    // Busca os cuidados só para o palpite mais forte, para poupar a cota
    // da Perenual. Os outros palpites o usuário pode escolher manualmente.
    let especie = null;
    try {
      especie = await especiePorNomeCientifico(palpites[0].nomeCientifico);
    } catch (erro) {
      console.warn("Perenual indisponível:", erro);
    }

    return NextResponse.json({ palpites, especie });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha na identificação";
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
