import type { Metadata } from "next";
import Link from "next/link";
import AtivarNotificacoes from "@/components/AtivarNotificacoes";
import FormularioPerfil from "@/components/FormularioPerfil";
import BotaoInstalar from "@/components/BotaoInstalar";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";
import { dataCurta } from "@/lib/traducoes";

export const metadata: Metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default async function PaginaAjustes() {
  const user = await usuarioAtual();
  const supabase = await criarClienteServidor();

  const { data: perfil } = await supabase.from("perfis").select("*").maybeSingle();

  const { data: arquivadasBrutas } = await supabase
    .from("plantas")
    .select("id, apelido, nome_comum, criado_em")
    .eq("arquivada", true)
    .order("apelido");

  const arquivadas = (arquivadasBrutas ?? []) as Pick<
    Planta,
    "id" | "apelido" | "nome_comum" | "criado_em"
  >[];

  return (
    <>
      <header className="area-segura-cima pt-6 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-suave">{user?.email}</p>
      </header>

      <div className="space-y-4">
        <FormularioPerfil
          nomeInicial={perfil?.nome ?? ""}
          tituloInicial={perfil?.titulo_jardim ?? ""}
        />

        <AtivarNotificacoes />

        <BotaoInstalar />

        {arquivadas.length > 0 && (
          <section className="rounded-suave border border-borda bg-superficie p-4">
            <h2 className="font-medium">Plantas arquivadas</h2>
            <ul className="mt-3 space-y-2">
              {arquivadas.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/planta/${p.id}`}
                    className="flex items-baseline justify-between gap-3 py-1.5"
                  >
                    <span className="text-sm">{p.apelido}</span>
                    <span className="text-xs text-suave">
                      desde {dataCurta(p.criado_em.slice(0, 10))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-suave border border-borda bg-superficie p-4">
          <h2 className="font-medium">Sobre os dados</h2>
          <p className="mt-2 text-sm leading-relaxed text-suave">
            A identificação das espécies vem da Pl@ntNet, e as informações de cultivo
            vêm da Perenual. O cronograma que o app mostra ajusta esses dados às
            condições que você informou — ambiente, luz, vaso e estação do ano.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-suave">
            Nenhum dos dois substitui olhar a planta. Enfiar o dedo na terra antes de
            regar continua sendo o melhor sensor que existe.
          </p>
        </section>

        <form action="/auth/sair" method="post">
          <button
            type="submit"
            className="w-full rounded-suave border border-borda bg-superficie px-4 py-3 font-medium text-alerta"
          >
            Sair
          </button>
        </form>
      </div>
    </>
  );
}
