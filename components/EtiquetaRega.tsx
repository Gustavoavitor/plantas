import { frasePendencia, statusRega } from "@/lib/cuidados";
import type { Planta } from "@/lib/tipos";
import { IconeGota } from "./Icones";

/**
 * Etiqueta de rega com barra de progresso.
 *
 * A barra enche conforme os dias passam desde a última rega e chega ao fim
 * no dia de regar — dá para ler o quanto falta sem processar o número.
 * Azul de água quando está tudo certo; muda de cor quando chega a hora.
 */

type Aparencia = {
  texto: string;
  fundo: string;
  borda: string;
  barra: string;
  trilho: string;
};

const APARENCIA: Record<ReturnType<typeof statusRega>["status"], Aparencia> = {
  em_dia: {
    texto: "text-agua",
    fundo: "bg-agua-clara",
    borda: "border-agua/25",
    barra: "bg-agua-barra",
    trilho: "bg-agua/15",
  },
  hoje: {
    texto: "text-atencao",
    fundo: "bg-atencao-clara",
    borda: "border-atencao/30",
    barra: "bg-atencao",
    trilho: "bg-atencao/15",
  },
  atrasada: {
    texto: "text-alerta",
    fundo: "bg-alerta-clara",
    borda: "border-alerta/30",
    barra: "bg-alerta",
    trilho: "bg-alerta/15",
  },
  sem_registro: {
    texto: "text-suave",
    fundo: "bg-papel",
    borda: "border-borda",
    barra: "bg-suave/40",
    trilho: "bg-borda",
  },
};

export default function EtiquetaRega({
  planta,
}: {
  planta: Pick<Planta, "ultima_rega" | "intervalo_rega_dias">;
}) {
  const status = statusRega(planta);
  const estilo = APARENCIA[status.status];

  // Quanto do ciclo já passou. Atrasada e "hoje" ficam cheias.
  const preenchido =
    status.status === "sem_registro"
      ? 0
      : status.diasDesde === null
        ? 0
        : Math.min(
            100,
            Math.max(4, (status.diasDesde / planta.intervalo_rega_dias) * 100),
          );

  return (
    <span
      className={`inline-flex flex-col gap-1.5 rounded-full border px-2.5 py-1.5 ${estilo.fundo} ${estilo.borda}`}
    >
      <span className={`flex items-center gap-1.5 text-xs font-semibold ${estilo.texto}`}>
        <IconeGota className="h-3.5 w-3.5" />
        {frasePendencia(status)}
      </span>

      {status.status !== "sem_registro" && (
        <span
          className={`h-1 w-full overflow-hidden rounded-full ${estilo.trilho}`}
          role="progressbar"
          aria-valuenow={Math.round(preenchido)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso até a próxima rega"
        >
          <span
            className={`block h-full rounded-full transition-[width] duration-500 ease-out ${estilo.barra}`}
            style={{ width: `${preenchido}%` }}
          />
        </span>
      )}
    </span>
  );
}
