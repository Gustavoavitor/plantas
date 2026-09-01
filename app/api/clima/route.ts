import { NextResponse, type NextRequest } from "next/server";
import { interpretarCodigo } from "@/lib/clima";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export const runtime = "nodejs";

/**
 * GET /api/clima?lat=-23.55&lon=-46.63
 *
 * Proxy da Open-Meteo, que é gratuita e não pede chave. Passa pelo servidor
 * para poder cachear: a temperatura não muda a cada abertura do app, e assim
 * a mesma coordenada não dispara uma consulta por visita.
 */
export async function GET(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ erro: "Coordenadas inválidas" }, { status: 400 });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ erro: "Coordenadas fora de alcance" }, { status: 400 });
  }

  // Arredondar para 2 casas (~1 km) melhora muito o aproveitamento do cache
  // e ainda evita guardar a posição exata de ninguém.
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(2));
  url.searchParams.set("longitude", lon.toFixed(2));
  url.searchParams.set("current", "temperature_2m,weather_code,is_day");
  url.searchParams.set("timezone", "auto");

  try {
    const r = await fetch(url, { next: { revalidate: 900 } });
    if (!r.ok) throw new Error(`Open-Meteo respondeu ${r.status}`);

    const dados = await r.json();
    const atual = dados?.current;

    if (!atual || typeof atual.temperature_2m !== "number") {
      throw new Error("Resposta sem temperatura");
    }

    const { tipo, descricao } = interpretarCodigo(Number(atual.weather_code));

    return NextResponse.json({
      temperatura: Math.round(atual.temperature_2m),
      tipo,
      descricao,
      ehDia: atual.is_day === 1,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Falha ao consultar o tempo";
    return NextResponse.json({ erro: mensagem }, { status: 502 });
  }
}
