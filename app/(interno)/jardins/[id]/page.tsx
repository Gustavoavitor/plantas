import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CartaoPlanta from "@/components/CartaoPlanta";
import { IconeVoltar } from "@/components/Icones";
import { ordenarPorUrgencia, statusRega } from "@/lib/cuidados";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/jardins/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("jardins").select("nome").eq("id", id).maybeSingle();
  return { title: data?.nome ?? "Jardim" };
}

export default async function PaginaJardim({ params }: PageProps<"/jardins/[id]">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data: jardim } = await supabase
    .from("jardins")
    .select("id, nome, local")
    .eq("id", id)
    .maybeSingle();

  if (!jardim) notFound();

  const { data } = await supabase
    .from("plantas")
    .select("*")
    .eq("arquivada", false)
    .eq("jardim_id", id)
    .order("criado_em", { ascending: false });

  const plantas = ordenarPorUrgencia((data ?? []) as Planta[]);

  const pendentes = plantas.filter((p) => {
    const s = statusRega(p).status;
    return s === "atrasada" || s === "hoje" || s === "sem_registro";
  });
  const emDia = plantas.filter((p) => statusRega(p).status === "em_dia");

  return (
    <>
      <header className="area-segura-cima pt-4 pb-5">
        <Link
          href="/jardins"
          className="-ml-2 inline-flex items-center gap-1 py-2 pr-3 pl-2 text-sm font-semibold text-suave"
        >
          <IconeVoltar className="h-5 w-5" />
          Jardins
        </Link>
        <h1 className="mt-2 font-manuscrita text-4xl leading-[1.3]">{jardim.nome}</h1>
        {jardim.local && <p className="mt-2 text-sm text-suave">{jardim.local}</p>}
      </header>

      {plantas.length === 0 && (
        <div className="rounded-suave border border-dashed border-borda px-6 py-12 text-center">
          <p className="text-3xl">🪴</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-suave">
            Nenhuma planta aqui ainda. Abra uma planta, toque em Editar e escolha
            este jardim.
          </p>
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
