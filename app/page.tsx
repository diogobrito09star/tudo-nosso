"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(dateSet: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!dateSet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Home() {
  const router = useRouter();
  const [savingRest, setSavingRest] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function loadStreak() {
      const { data } = await supabase.from("sessions").select("date");
      const dateSet = new Set((data ?? []).map((r: { date: string }) => r.date));
      setStreak(computeStreak(dateSet));
    }
    loadStreak();
  }, []);

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

      {streak > 0 && (
        <p style={{ marginTop: -12, marginBottom: 22, fontWeight: 700 }}>
          🔥 {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
        </p>
      )}

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

