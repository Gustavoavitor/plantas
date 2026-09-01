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
  const [, iniciar] = useTransition();
  const [feito, setFeito] = useState(false);
  const [falhou, setFalhou] = useState(false);

  function regar() {
    // Confirma na hora, sem esperar o servidor: no 4G a viagem de ida e
    // volta passa de meio segundo, e o botão parecia travado nesse tempo.
    setFeito(true);
    setFalhou(false);

    iniciar(async () => {
      const r = await registrarCuidado(plantaId, "rega");
      if ("erro" in r && r.erro) {
        setFeito(false);
        setFalhou(true);
        return;
      }
      setTimeout(() => setFeito(false), 2500);
    });
  }

  const compacto = variante === "compacto";

  return (
    <button
      type="button"
      onClick={regar}
      disabled={feito}
      aria-label="Registrar rega"
      className={
        compacto
          ? "flex shrink-0 items-center gap-1.5 rounded-full border border-folha/30 bg-folha-clara px-3 py-2 text-sm font-semibold text-folha disabled:opacity-70"
          : "flex w-full items-center justify-center gap-2 rounded-suave bg-folha px-4 py-3 font-semibold text-white disabled:opacity-70 dark:text-papel"
      }
    >
      <IconeGota className="h-5 w-5" />
      {falhou ? "Tentar de novo" : feito ? "Regada" : compacto ? "Reguei" : "Registrar rega"}
    </button>
  );
}
