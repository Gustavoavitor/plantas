import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AcoesCuidado from "@/components/AcoesCuidado";
import CalendarioCuidados from "@/components/CalendarioCuidados";
import { IconeVoltar } from "@/components/Icones";
import PainelDiagnostico from "@/components/PainelDiagnostico";
import { buscarCuidados, type Nivel } from "@/lib/catalogo";
import { frasePendencia, statusAdubacao, statusRega } from "@/lib/cuidados";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/servidor";
import type { EventoCuidado, Planta } from "@/lib/tipos";
import { ROTULOS } from "@/lib/tipos";
import { dataCurta, dataLonga, traduzirRega } from "@/lib/traducoes";

export const dynamic = "force-dynamic";

const NIVEL: Record<Nivel, string> = {
  facil: "Fácil",
  media: "Exige atenção",
  dificil: "Difícil",
};

export async function generateMetadata({ params }: PageProps<"/planta/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("plantas").select("apelido").eq("id", id).maybeSingle();
  return { title: data?.apelido ?? "Planta" };
}

export default async function PaginaPlanta({ params }: PageProps<"/planta/[id]">) {
  const { id } = await params;
  const user = await usuarioAtual();
  const supabase = await criarClienteServidor();

  const { data: planta } = await supabase.from("plantas").select("*").eq("id", id).maybeSingle();
  if (!planta || !user) notFound();

  const p = planta as Planta;

  const { data: eventosBrutos } = await supabase
    .from("eventos_cuidado")
    .select("id, planta_id, tipo, data, observacao, criado_em")
    .eq("planta_id", id)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false })
    // O calendário navega meses para trás, então carregamos bem mais que a
    // lista mostra. Numa planta pessoal isso não passa de algumas centenas.
    .limit(500);

  const eventos = (eventosBrutos ?? []) as EventoCuidado[];

  // A ficha vem do catálogo local, a partir do nome científico.
  const { entrada, precisao } = buscarCuidados(p.nome_cientifico);
  const temFicha = p.nome_cientifico !== null && precisao !== "padrao";

  const rega = statusRega(p);
  const aduba = statusAdubacao(p);

  return (
    <>
      <header className="area-segura-cima pt-4 pb-4">
        <Link
          href="/jardim"
          className="-ml-2 inline-flex items-center gap-1 py-2 pr-3 pl-2 text-sm font-medium text-suave"
        >
          <IconeVoltar className="h-5 w-5" />
          Jardim
        </Link>
      </header>

      {p.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.foto_url}
          alt={p.apelido}
          className="mb-5 aspect-4/3 w-full rounded-suave object-cover"
        />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{p.apelido}</h1>
        {(p.nome_comum || p.nome_cientifico) && (
          <p className="mt-1 text-suave">
            {p.nome_comum}
            {p.nome_comum && p.nome_cientifico && " · "}
            {p.nome_cientifico && <span className="italic">{p.nome_cientifico}</span>}
          </p>
        )}
        <p className="mt-2 text-sm text-suave">
          {ROTULOS.ambiente[p.ambiente]} · {ROTULOS.luz[p.luz]} · {ROTULOS.vaso[p.tamanho_vaso]}
        </p>
      </div>

      {/* Situação atual */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Painel
          titulo="Rega"
          destaque={frasePendencia(rega)}
          alerta={rega.status === "atrasada"}
          atencao={rega.status === "hoje"}
          rodape={
            p.ultima_rega
              ? `Última: ${dataCurta(p.ultima_rega)} · a cada ${p.intervalo_rega_dias} dias`
              : `A cada ${p.intervalo_rega_dias} dias`
          }
        />
        <Painel
          titulo="Adubação"
          destaque={
            p.intervalo_aduba_dias === 0
              ? "Pausada"
              : aduba.status === "sem_registro"
                ? "Sem registro"
                : aduba.status === "atrasada"
                  ? `Atrasada ${Math.abs(aduba.diasRestantes!)} d`
                  : aduba.status === "hoje"
                    ? "Adubar hoje"
                    : `Em ${aduba.diasRestantes} dias`
          }
          atencao={p.intervalo_aduba_dias > 0 && aduba.status === "atrasada"}
          rodape={
            p.intervalo_aduba_dias === 0
              ? "Retoma na primavera"
              : p.ultima_aduba
                ? `Última: ${dataCurta(p.ultima_aduba)}`
                : `A cada ${p.intervalo_aduba_dias} dias`
          }
        />
      </div>

      <div className="mb-6">
        <AcoesCuidado
          plantaId={p.id}
          usuarioId={user.id}
          adubacaoPausada={p.intervalo_aduba_dias === 0}
        />
      </div>

      <div className="mb-6">
        <PainelDiagnostico plantaId={p.id} />
      </div>

      {/* Ficha da espécie */}
      {temFicha && (
        <section className="mb-6 rounded-suave border border-borda bg-superficie p-4">
          <h2 className="mb-3 font-medium">Sobre a espécie</h2>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Dado rotulo="Rega" valor={traduzirRega(entrada.rega)} />
            <Dado rotulo="Luz" valor={entrada.luz.join(", ")} />
            <Dado rotulo="Ciclo" valor={entrada.ciclo} />
            <Dado rotulo="Dificuldade" valor={NIVEL[entrada.nivel]} />
            {entrada.toleraSeca && <Dado rotulo="Seca" valor="Tolera bem" />}
            {entrada.interno && <Dado rotulo="Interior" valor="Adapta-se bem" />}
          </dl>

          {entrada.toxicaAnimais && (
            <p className="mt-4 rounded-suave border border-atencao/30 bg-atencao-clara px-3 py-2.5 text-sm text-atencao">
              Tóxica para cães e gatos. Deixe fora do alcance deles.
            </p>
          )}

          {entrada.dicas.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold tracking-wide text-suave uppercase">
                Bom saber
              </h3>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-suave">
                {entrada.dicas.map((d) => (
                  <li key={d}>• {d}</li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-4 border-t border-borda pt-3 text-xs leading-relaxed text-suave">
            {precisao === "especie"
              ? "Cuidados desta espécie, ajustados para as condições que você informou."
              : precisao === "genero"
                ? "Cuidados do gênero, ajustados para as suas condições. Vale para as espécies parecidas."
                : "Não tenho esta espécie no catálogo. Estes são os cuidados típicos da família."}
          </p>
        </section>
      )}

      {p.notas && (
        <section className="mb-6 rounded-suave border border-borda bg-superficie p-4">
          <h2 className="mb-2 font-medium">Anotações</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-suave">{p.notas}</p>
        </section>
      )}

      {/* Calendário */}
      <div className="mb-6">
        <CalendarioCuidados plantaId={p.id} eventos={eventos} />
      </div>

      {/* Histórico */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-suave uppercase">
          Histórico
        </h2>

        {eventos.length === 0 ? (
          <p className="rounded-suave border border-dashed border-borda px-4 py-6 text-center text-sm text-suave">
            Nada registrado ainda.
          </p>
        ) : (
          <ol className="space-y-0.5">
            {eventos.slice(0, 25).map((e) => (
              <li key={e.id} className="flex items-baseline gap-3 py-2">
                <span className="w-20 shrink-0 text-sm text-suave tabular-nums">
                  {dataCurta(e.data)}
                </span>
                <span className="flex-1 text-sm">
                  {ROTULOS.evento[e.tipo]}
                  {e.observacao && <span className="text-suave"> — {e.observacao}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="flex gap-3">
        <Link
          href={`/planta/${p.id}/editar`}
          className="flex-1 rounded-suave border border-borda bg-superficie px-4 py-3 text-center font-medium"
        >
          Editar
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-suave">
        No jardim desde {dataLonga(p.criado_em.slice(0, 10))}
      </p>
    </>
  );
}

function Painel({
  titulo,
  destaque,
  rodape,
  alerta,
  atencao,
}: {
  titulo: string;
  destaque: string;
  rodape: string;
  alerta?: boolean;
  atencao?: boolean;
}) {
  const cor = alerta
    ? "border-alerta/30 bg-alerta-clara"
    : atencao
      ? "border-atencao/30 bg-atencao-clara"
      : "border-borda bg-superficie";
  const corTexto = alerta ? "text-alerta" : atencao ? "text-atencao" : "text-tinta";

  return (
    <div className={`rounded-suave border p-4 ${cor}`}>
      <p className="text-xs font-semibold tracking-wide text-suave uppercase">{titulo}</p>
      <p className={`mt-1.5 font-medium ${corTexto}`}>{destaque}</p>
      <p className="mt-1 text-xs leading-relaxed text-suave">{rodape}</p>
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div>
      <dt className="text-xs text-suave">{rotulo}</dt>
      <dd className="mt-0.5">{valor}</dd>
    </div>
  );
}
