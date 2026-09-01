import NavegacaoInferior from "@/components/NavegacaoInferior";

export default function LayoutInterno({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-6">{children}</div>
      <NavegacaoInferior />
    </div>
  );
}
