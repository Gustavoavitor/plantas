import Link from "next/link";
import { frasePendencia, statusRega } from "@/lib/cuidados";
import type { Planta } from "@/lib/tipos";
import BotaoRegar from "./BotaoRegar";

const CORES = {
  atrasada: "border-alerta/30 bg-alerta-clara text-alerta",
  hoje: "border-atencao/30 bg-atencao-clara text-atencao",
  sem_registro: "border-borda bg-papel text-suave",
  em_dia: "border-borda bg-papel text-suave",
} as const;

/** "lírio-da-paz" como apelido e como nome comum é repetição inútil no card. */
function mesmoTexto(a: string | null, b: string) {
  if (!a) return false;
  const normalizar = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/[-\s]+/g, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  return normalizar(a) === normalizar(b);
}

export default function CartaoPlanta({ planta }: { planta: Planta }) {
  const status = statusRega(planta);
  const precisa = status.status === "atrasada" || status.status === "hoje";

  const secundario = planta.nome_comum ?? planta.nome_cientifico;
  const mostrarSecundario = secundario && !mesmoTexto(secundario, planta.apelido);

  return (
    <li className="overflow-hidden rounded-suave border border-borda bg-superficie">
      <div className="flex items-center gap-3 p-3">
        <Link href={`/planta/${planta.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          {planta.foto_url ? (
            // Foto vem do Supabase Storage; <img> evita configurar domínios remotos.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={planta.foto_url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-folha-clara text-2xl">
              🌿
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{planta.apelido}</p>
            {mostrarSecundario && (
              <p className="truncate text-sm text-suave">{secundario}</p>
            )}
            <span
              className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${CORES[status.status]}`}
            >
              {frasePendencia(status)}
            </span>
          </div>
        </Link>

        {precisa || status.status === "sem_registro" ? <BotaoRegar plantaId={planta.id} /> : null}
      </div>
    </li>
  );
}
