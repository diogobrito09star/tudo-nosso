"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function computeStreak(trainingDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!trainingDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (trainingDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function Home() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function loadStreak() {
      const { data } = await supabase.from("sessions").select("date, mode");
      const trainingDates = new Set(
        (data ?? [])
          .filter((r: { mode: string }) => r.mode !== "descanso" && r.mode !== "magoado")
          .map((r: { date: string }) => r.date)
      );
      setStreak(computeStreak(trainingDates));
    }
    loadStreak();
  }, []);

  return (
    <main>
      <div className="eyebrow">Calistenia</div>
      <h1>Plano de treino</h1>

      {streak >= 2 && (
        <p style={{ marginTop: -12, marginBottom: 22, fontWeight: 700 }}>
          🔥 {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
        </p>
      )}

      <Link href="/registar" className="action-btn dark">
        Vou treinar
      </Link>

      <Link href="/descanso" className="action-btn moss">
        Hoje é descanso
      </Link>

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

