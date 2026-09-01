/**
 * Aparece na hora em que a aba é tocada, enquanto o servidor monta a tela.
 * Sem isto a navegação fica parada na página anterior até a resposta chegar,
 * que é o atraso que se sente ao trocar de aba no celular.
 */
export default function Carregando() {
  return (
    <div className="area-segura-cima pt-6" aria-busy="true" aria-label="Carregando">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-24 animate-pulse rounded-full bg-borda/60" />
        <div className="h-10 w-2/3 animate-pulse rounded-xl bg-borda/60" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-suave border border-borda bg-superficie p-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-borda/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-borda/60" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-borda/50" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-borda/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
