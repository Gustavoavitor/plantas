import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FluxoNovaPlanta from "@/components/FluxoNovaPlanta";
import { usuarioAtual } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Nova planta" };
export const dynamic = "force-dynamic";

export default async function PaginaNovaPlanta() {
  const user = await usuarioAtual();
  if (!user) redirect("/entrar");

  return (
    <>
      <header className="area-segura-cima pt-6 pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Nova planta</h1>
        <p className="mt-1 text-sm text-suave">
          Tire uma foto e eu identifico a espécie e monto os cuidados.
        </p>
      </header>

      <FluxoNovaPlanta usuarioId={user.id} />
    </>
  );
}
