"use client";

import { useState, useTransition } from "react";
import { registrarCuidado } from "@/app/acoes";
import { IconeGota } from "./Icones";

type Props = {
  plantaId: string;
  /** Compacto para o card da lista; completo para a tela da planta. */
  variante?: "compacto" | "completo";
};

export default function BotaoRegar({ plantaId, variante = "compacto" }: Props) {
  const [pendente, iniciar] = useTransition();
  const [feito, setFeito] = useState(false);

  function regar() {
    iniciar(async () => {
      const r = await registrarCuidado(plantaId, "rega");
      if (!("erro" in r)) {
        setFeito(true);
        setTimeout(() => setFeito(false), 2500);
      }
    });
  }

  const compacto = variante === "compacto";

  return (
    <button
      type="button"
      onClick={regar}
      disabled={pendente || feito}
      aria-label="Registrar rega"
      className={
        compacto
          ? "flex shrink-0 items-center gap-1.5 rounded-full border border-folha/30 bg-folha-clara px-3 py-2 text-sm font-medium text-folha transition-opacity disabled:opacity-60"
          : "flex w-full items-center justify-center gap-2 rounded-suave bg-folha px-4 py-3 font-medium text-white transition-opacity disabled:opacity-60 dark:text-papel"
      }
    >
      <IconeGota className="h-5 w-5" />
      {feito ? "Regada" : pendente ? "…" : compacto ? "Reguei" : "Registrar rega"}
    </button>
  );
}
