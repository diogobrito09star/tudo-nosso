"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <main>
        <div className="eyebrow">Tudo Nosso</div>
        <h1>Verifica o email</h1>
        <p className="muted">
          Enviámos um link de acesso para <strong>{email}</strong>. Abre o
          email nesse mesmo telemóvel ou computador e clica no link para
          entrares.
        </p>
      </main>
    );
  }

  return (
    <main>
      <div className="eyebrow">Tudo Nosso</div>
      <h1>Entrar</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@exemplo.com"
        />
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "A enviar..." : "Enviar link de acesso"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
