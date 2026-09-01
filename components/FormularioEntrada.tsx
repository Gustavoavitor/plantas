"use client";

import { useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";

export default function FormularioEntrada({ proxima }: { proxima: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado">("parado");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEstado("enviando");

    const supabase = criarClienteNavegador();
    const destino = new URL("/auth/callback", window.location.origin);
    destino.searchParams.set("proxima", proxima);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: destino.toString() },
    });

    if (error) {
      setErro(error.message);
      setEstado("parado");
      return;
    }

    setEstado("enviado");
  }

  if (estado === "enviado") {
    return (
      <div className="rounded-suave border border-folha/25 bg-folha-clara px-5 py-6">
        <p className="font-medium text-folha">Link enviado.</p>
        <p className="mt-2 text-sm leading-relaxed text-tinta/80">
          Abra o e-mail em <strong>{email}</strong> e toque no link para entrar. Se
          estiver no iPhone, abra pelo Safari para o app funcionar direito.
        </p>
        <button
          type="button"
          onClick={() => setEstado("parado")}
          className="mt-4 text-sm font-medium text-folha underline underline-offset-4"
        >
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Seu e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {erro && (
        <p role="alert" className="text-sm text-alerta">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="w-full rounded-suave bg-folha px-4 py-3 font-medium text-white transition-opacity disabled:opacity-60 dark:text-papel"
      >
        {estado === "enviando" ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
