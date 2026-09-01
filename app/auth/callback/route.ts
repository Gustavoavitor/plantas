import { NextResponse, type NextRequest } from "next/server";
import { criarClienteAdmin, criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Recebe o clique no link do e-mail, troca o código por uma sessão e
 * confere se o e-mail está na lista de convidados.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const proxima = searchParams.get("proxima") ?? "/jardim";

  if (!codigo) {
    return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
  }

  const email = data.user.email.toLowerCase();

  // Lista de acesso: só entra quem foi convidado.
  const admin = criarClienteAdmin();
  const { data: convite } = await admin
    .from("convites")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!convite) {
    await supabase.auth.signOut();
    // Remove a conta recém-criada para não deixar lixo no banco.
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    return NextResponse.redirect(`${origin}/entrar?erro=nao_convidado`);
  }

  const destino = proxima.startsWith("/") ? proxima : "/jardim";
  return NextResponse.redirect(`${origin}${destino}`);
}
