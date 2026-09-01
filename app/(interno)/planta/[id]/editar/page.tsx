import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioEdicao from "@/components/FormularioEdicao";
import { IconeVoltar } from "@/components/Icones";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const metadata: Metadata = { title: "Editar planta" };
export const dynamic = "force-dynamic";

export default async function PaginaEditar({ params }: PageProps<"/planta/[id]/editar">) {
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data } = await supabase.from("plantas").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <>
      <header className="area-segura-cima pt-4 pb-5">
        <Link
          href={`/planta/${id}`}
          className="-ml-2 inline-flex items-center gap-1 py-2 pr-3 pl-2 text-sm font-medium text-suave"
        >
          <IconeVoltar className="h-5 w-5" />
          Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Editar</h1>
      </header>

      <FormularioEdicao planta={data as Planta} />
    </>
  );
}
