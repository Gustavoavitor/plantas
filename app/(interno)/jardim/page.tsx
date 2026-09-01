import type { Metadata } from "next";
import Link from "next/link";
import CartaoPlanta from "@/components/CartaoPlanta";
import ClimaAgora from "@/components/Clima";
import { IconeFlor, IconeMais } from "@/components/Icones";
import { estacaoDoAno, ordenarPorUrgencia, statusRega } from "@/lib/cuidados";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const metadata: Metadata = { title: "Jardim" };
export const dynamic = "force-dynamic";

const SAUDACAO_ESTACAO = {
  verao: "Verão: as plantas bebem mais e secam rápido.",
  outono: "Outono: o crescimento começa a desacelerar.",
  inverno: "Inverno: regue menos e segure o adubo.",
  primavera: "Primavera: época de crescer, replantar e adubar.",
} as const;

export default async function PaginaJardim() {
  const supabase = await criarClienteServidor();

  const [{ data }, { data: perfil }] = await Promise.all([
    supabase
      .from("plantas")
      .select("*")
      .eq("arquivada", false)
      .order("criado_em", { ascending: false }),
    // select("*") em vez de nomear colunas: assim a tela não quebra se a
    // migração dos jardins ainda não tiver rodado.
    supabase.from("perfis").select("*").maybeSingle(),
  ]);

  const titulo =
    perfil?.titulo_jardim?.trim() ||
    (perfil?.nome ? `Jardim de ${perfil.nome}` : "Meu jardim");

  const plantas = ordenarPorUrgencia((data ?? []) as Planta[]);

  const pendentes = plantas.filter((p) => {
    const s = statusRega(p).status;
    return s === "atrasada" || s === "hoje" || s === "sem_registro";
  });
  const emDia = plantas.filter((p) => statusRega(p).status === "em_dia");

  return (
    <>
      <header className="area-segura-cima pt-6 pb-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <ClimaAgora />
          <Link
            href="/nova"
            aria-label="Adicionar planta"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-folha text-white dark:text-papel"
          >
            <IconeMais />
          </Link>
        </div>

        {/* O subtítulo fica fora da linha do título: a fonte manuscrita tem
            hastes que passam da caixa de texto e cortariam a frase abaixo. */}
        <div className="flex items-center gap-3">
          <IconeFlor className="h-9 w-9 shrink-0 text-folha" />
          <h1 className="min-w-0 font-manuscrita text-4xl leading-[1.3] break-words">
            {titulo}
          </h1>
        </div>
        <p className="mt-2 text-sm text-suave">{SAUDACAO_ESTACAO[estacaoDoAno()]}</p>
      </header>

      {plantas.length === 0 && (
        <div className="rounded-suave border border-dashed border-borda px-6 py-14 text-center">
          <p className="text-4xl">🪴</p>
          <h2 className="mt-4 text-lg font-medium">Seu jardim está vazio</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-suave">
            Tire uma foto da primeira planta. Eu identifico a espécie e monto o
            cronograma de rega para as suas condições.
          </p>
          <Link
            href="/nova"
            className="mt-6 inline-block rounded-suave bg-folha px-5 py-3 font-medium text-white dark:text-papel"
          >
            Adicionar planta
          </Link>
        </div>
      )}

      {pendentes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-suave uppercase">
            Precisam de você
          </h2>
          <ul className="space-y-3">
            {pendentes.map((p) => (
              <CartaoPlanta key={p.id} planta={p} />
            ))}
          </ul>
        </section>
      )}

      {emDia.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-suave uppercase">
            Em dia
          </h2>
          <ul className="space-y-3">
            {emDia.map((p) => (
              <CartaoPlanta key={p.id} planta={p} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
