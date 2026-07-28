"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const router = useRouter();
  const [savingRest, setSavingRest] = useState(false);

  async function marcarDescanso() {
    setSavingRest(true);
    await supabase.from("sessions").upsert(
      {
        date: todayISO(),
        mode: "descanso",
        overall_rating: null,
        note: null,
      },
      { onConflict: "date" }
    );
    setSavingRest(false);
    router.push("/historico");
  }

  return (
    <main>
      <div className="eyebrow">Calistenia</div>
      <h1>Plano de treino</h1>

      <Link href="/registar" className="action-btn dark">
        Vou treinar
      </Link>

      <button
        className="action-btn moss"
        onClick={marcarDescanso}
        disabled={savingRest}
        style={{ width: "100%" }}
      >
        {savingRest ? "A guardar..." : "Hoje é descanso"}
      </button>

      <div style={{ marginTop: 24 }}>
        <Link href="/historico" className="nav-row">
          <span>Ver registos</span>
          <span className="arrow">→</span>
        </Link>
        <Link href="/evolucao" className="nav-row">
          <span>Ver evolução (gráficos)</span>
          <span className="arrow">→</span>
        </Link>
      </div>
    </main>
  );
}
