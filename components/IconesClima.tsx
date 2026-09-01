import type { TipoClima } from "@/lib/clima";

type Props = { className?: string };

/**
 * Ícones de tempo em traço simples, no mesmo peso do resto do app.
 * O sol vira lua à noite; os demais valem para as duas horas do dia.
 */

function Sol({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

function Lua({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" strokeLinejoin="round" />
    </svg>
  );
}

function SolNuvem({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M8.5 2.6v1.3M3.8 8H2.5M4.9 4.4l-.9-.9M12.2 4.4l.9-.9" strokeLinecap="round" />
      <path d="M8 19.5h9a3.2 3.2 0 0 0 .3-6.4 4.6 4.6 0 0 0-8.9-.8A3.4 3.4 0 0 0 8 19.5z" strokeLinejoin="round" />
    </svg>
  );
}

function Nuvem({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M7 18.5h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.7-.9A3.7 3.7 0 0 0 7 18.5z" strokeLinejoin="round" />
    </svg>
  );
}

function Chuva({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M7 15.5h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.7-.9A3.7 3.7 0 0 0 7 15.5z" strokeLinejoin="round" />
      <path d="M9 18.5l-.8 2M13 18.5l-.8 2M17 18.5l-.8 2" strokeLinecap="round" />
    </svg>
  );
}

function Tempestade({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M7 14.5h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.7-.9A3.7 3.7 0 0 0 7 14.5z" strokeLinejoin="round" />
      <path d="M13 16.5l-2.5 3.5h3l-2 3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Neve({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M7 14.5h10a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.7-.9A3.7 3.7 0 0 0 7 14.5z" strokeLinejoin="round" />
      <path d="M9 18.2v2.2M8 19.3h2M14 18.2v2.2M13 19.3h2" strokeLinecap="round" />
    </svg>
  );
}

function Neblina({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M4 9h13M6 13h14M4 17h11" strokeLinecap="round" />
    </svg>
  );
}

export default function IconeClima({
  tipo,
  ehDia,
  className = "h-6 w-6",
}: {
  tipo: TipoClima;
  ehDia: boolean;
  className?: string;
}) {
  switch (tipo) {
    case "limpo":
      return ehDia ? <Sol className={className} /> : <Lua className={className} />;
    case "poucas_nuvens":
      return ehDia ? <SolNuvem className={className} /> : <Nuvem className={className} />;
    case "chuva":
      return <Chuva className={className} />;
    case "tempestade":
      return <Tempestade className={className} />;
    case "neve":
      return <Neve className={className} />;
    case "neblina":
      return <Neblina className={className} />;
    default:
      return <Nuvem className={className} />;
  }
}
