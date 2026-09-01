import type { Metadata } from "next";
import GerenciarJardins, { type JardimComContagem } from "@/components/GerenciarJardins";
import { statusRega } from "@/lib/cuidados";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Planta } from "@/lib/tipos";

export const metadata: Metadata = { title: "Jardins" };
export const dynamic = "force-dynamic";

export default async function PaginaJardins() {
  const supabase = await criarClienteServidor();

  const [{ data: jardinsBrutos, error: erroJardins }, { data: plantasBrutas }] =
    await Promise.all([
      supabase.from("jardins").select("id, nome, local").order("nome"),
      supabase.from("plantas").select("*").eq("arquivada", false),
    ]);

  // A migração dos jardins é um passo separado; sem ela a tabela não existe.
  const faltaMigracao = Boolean(erroJardins);

  const plantas = (plantasBrutas ?? []) as Array<Planta & { jardim_id?: string | null }>;

  const contar = (id: string | null) => {
    const doLugar = plantas.filter((p) => (p.jardim_id ?? null) === id);
    const pendentes = doLugar.filter((p) => {
      const s = statusRega(p).status;
      return s === "atrasada" || s === "hoje" || s === "sem_registro";
    }).length;
    return { plantas: doLugar.length, pendentes };
  };

  const jardins: JardimComContagem[] = (jardinsBrutos ?? []).map((j) => ({
    id: j.id,
    nome: j.nome,
    local: j.local,
    ...contar(j.id),
  }));

  const semJardim = contar(null).plantas;

  return (
    <>
      <header className="area-segura-cima pt-6 pb-5">
        <h1 className="font-manuscrita text-4xl leading-[1.3]">Meus jardins</h1>
        <p className="mt-2 text-sm text-suave">
          Um lugar para cada canto onde você tem planta.
        </p>
      </header>

      {faltaMigracao ? (
        <div className="rounded-suave border border-atencao/30 bg-atencao-clara p-4">
          <h2 className="font-semibold text-atencao">Falta um passo no banco</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Abra o <strong>SQL Editor</strong> do Supabase e rode o arquivo{" "}
            <code className="rounded bg-papel px-1 py-0.5 text-xs">
              supabase/migracao-002-jardins.sql
            </code>
            . Ele cria a tabela de jardins e a coluna do título personalizado.
          </p>
          <p className="mt-2 text-xs text-suave">
            Nada mais no app depende disso — o resto segue funcionando normalmente.
          </p>
        </div>
      ) : (
        <GerenciarJardins jardins={jardins} semJardim={semJardim} />
      )}
    </>
  );
}
