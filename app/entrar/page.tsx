import type { Metadata } from "next";
import FormularioEntrada from "@/components/FormularioEntrada";

export const metadata: Metadata = { title: "Entrar" };

const MENSAGENS: Record<string, string> = {
  nao_convidado:
    "Esse e-mail não está na lista de acesso. Peça para o Gustavo liberar o seu endereço.",
  link_invalido: "O link expirou ou já foi usado. Peça um novo abaixo.",
  falha: "Algo deu errado ao entrar. Tente de novo.",
};

export default async function PaginaEntrar({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const erro = typeof params.erro === "string" ? MENSAGENS[params.erro] : null;
  const proxima = typeof params.proxima === "string" ? params.proxima : "/jardim";

  return (
    <main className="area-segura-cima flex min-h-dvh flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-folha-clara">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-folha" aria-hidden>
              <path d="M12 21V11" strokeLinecap="round" />
              <path d="M12 13c0-3.3 2.5-6 5.5-6 .3 3.6-2 6.6-5.5 7z" strokeLinejoin="round" />
              <path d="M12 16c0-3-2.2-5.5-5-5.5-.3 3.3 1.9 6 5 6.4z" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Plantas</h1>
          <p className="mt-2 text-suave">
            Lembretes de rega, diagnóstico e cuidados para o seu jardim.
          </p>
        </div>

        {erro && (
          <p
            role="alert"
            className="mb-5 rounded-suave border border-alerta/30 bg-alerta-clara px-4 py-3 text-sm text-alerta"
          >
            {erro}
          </p>
        )}

        <FormularioEntrada proxima={proxima} />

        <p className="mt-8 text-xs leading-relaxed text-suave">
          Acesso restrito a convidados. Você recebe um link por e-mail e entra sem
          precisar decorar senha.
        </p>
      </div>
    </main>
  );
}
