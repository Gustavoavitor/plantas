import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { chavePublicaSupabase, urlSupabase } from "@/lib/supabase/config";

/** Telas que podem ser abertas sem login. */
const PUBLICAS = ["/entrar", "/auth", "/manifest.webmanifest", "/sw.js"];

/**
 * A partir do Next 16 o antigo `middleware.ts` se chama `proxy.ts`.
 * Aqui a sessão do Supabase é renovada antes de cada requisição, e quem
 * não está logado é mandado para a tela de entrada.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  // Sem as variáveis do Supabase não há sessão para renovar. Em vez de
  // derrubar toda requisição com um 500 opaco, deixamos passar: a página
  // dá um erro legível e /api/diagnostico continua acessível para dizer
  // exatamente qual variável está faltando.
  let url: string;
  let chave: string;
  try {
    url = urlSupabase();
    chave = chavePublicaSupabase();
  } catch {
    return resposta;
  }

  const supabase = createServerClient(
    url,
    chave,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(paraDefinir) {
          for (const { name, value } of paraDefinir) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of paraDefinir) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Não remova: é esta chamada que renova o token antes de ele expirar.
  // Se o Supabase estiver fora do ar, tratamos como "não logado" em vez de
  // derrubar o site inteiro com um erro 500.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  const caminho = request.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => caminho === p || caminho.startsWith(`${p}/`));

  // Nada de página de gente logada em cache compartilhado. A sessão já vive
  // num cookie por navegador, mas isto fecha a porta para um intermediário
  // (CDN, proxy da operadora) guardar a tela de uma pessoa e servir a outra.
  if (user) {
    resposta.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }

  // Rota de API nunca é redirecionada: cada handler confere o login por conta
  // própria e responde 401 em JSON. Redirecionar aqui devolveria o HTML da
  // tela de entrada, e o `fetch` do cliente quebraria ao tentar ler o JSON.
  if (caminho.startsWith("/api/")) {
    return resposta;
  }

  if (!user && !ehPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proxima", caminho);
    return NextResponse.redirect(url);
  }

  if (user && caminho === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = "/jardim";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, menos arquivos estáticos e imagens.
     */
    "/((?!_next/static|_next/image|favicon.ico|icones|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
