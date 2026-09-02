import type { Metadata } from "next";
import Link from "next/link";
import CartaoPlanta from "@/components/CartaoPlanta";
import ClimaAgora from "@/components/Clima";
import { IconeFlor, IconeMais } from "@/components/Icones";
import { estacaoDoAno, ordenarPorUrgencia, statusRega } from "@/lib/cuidados";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/servidor";
import { tituloDoJardim } from "@/lib/titulo";
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
  const user = await usuarioAtual();

  const [{ data }, { data: perfil }] = await Promise.all([
    supabase
      .from("plantas")
      .select("*")
      .eq("arquivada", false)
      .order("criado_em", { ascending: false }),
    // O filtro por id é explícito de propósito: `maybeSingle` falha se vier
    // mais de uma linha, e bastou uma segunda pessoa criar conta para o
    // título cair no genérico. Não se apoia no RLS para escolher a linha.
    // select("*") mantém a tela de pé se a migração dos jardins não rodou.
    supabase
      .from("perfis")
      .select("*")
      .eq("id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const titulo = tituloDoJardim(perfil);

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

        {/* A flor é inline dentro do título e alinhada pela linha de base,
            não por flexbox: assim ela acompanha a letra mesmo com as métricas
            estranhas da fonte manuscrita, que variam entre iOS e Android.
            O subtítulo fica fora do <h1> porque as hastes passam da caixa. */}
        <h1 className="titulo-jardim">
          <IconeFlor className="mr-[0.3em] inline-block h-[1em] w-[1em] shrink-0 align-[-0.15em] text-folha" />
          {titulo}
        </h1>
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
