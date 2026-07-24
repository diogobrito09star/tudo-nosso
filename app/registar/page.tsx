"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/app/components/BottomNav";
import type { Exercise, SessionMode } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function RegistarPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SessionMode>("rua");
  const [date, setDate] = useState(todayISO());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [repsByExercise, setRepsByExercise] = useState<Record<string, string>>(
    {}
  );
  const [ratingByExercise, setRatingByExercise] = useState<
    Record<string, string>
  >({});
  const [overallRating, setOverallRating] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: ex } = await supabase
        .from("exercises")
        .select("*")
        .order("sort_order");
      setExercises((ex as Exercise[]) ?? []);
    }
    checkAuthAndLoad();
  }, [router]);

  const visibleExercises = exercises.filter(
    (e) => mode === "descanso" ? false : (e.mode === mode || e.mode === "ambos")
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setError("Sessão expirou, entra outra vez.");
      setSaving(false);
      return;
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .upsert(
        {
          profile_id: userId,
          date,
          mode,
          overall_rating: overallRating ? Number(overallRating) : null,
          note: note || null,
        },
        { onConflict: "profile_id,date" }
      )
      .select()
      .single();

    if (sessionError || !sessionRow) {
      setError(sessionError?.message ?? "Erro ao guardar a sessão.");
      setSaving(false);
      return;
    }

    if (mode !== "descanso") {
      await supabase
        .from("session_exercises")
        .delete()
        .eq("session_id", sessionRow.id);

      const rows = visibleExercises
        .filter((ex) => repsByExercise[ex.id]?.trim())
        .map((ex) => ({
          session_id: sessionRow.id,
          exercise_id: ex.id,
          reps_per_set: repsByExercise[ex.id]
            .split(",")
            .map((v) => parseInt(v.trim(), 10))
            .filter((n) => !Number.isNaN(n)),
          rating: ratingByExercise[ex.id]
            ? Number(ratingByExercise[ex.id])
            : null,
          note: null,
        }));

      if (rows.length > 0) {
        const { error: rowsError } = await supabase
          .from("session_exercises")
          .insert(rows);
        if (rowsError) {
          setError(rowsError.message);
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  return (
    <main>
      <div className="eyebrow">Tudo Nosso</div>
      <h1>Registar treino</h1>

      <div className="tabs">
        {(["rua", "casa", "descanso"] as SessionMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`tab ${mode === m ? "active" : ""}`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="date">Data</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {mode !== "descanso" && (
          <div className="card" style={{ marginTop: 16 }}>
            {visibleExercises.map((ex) => (
              <div key={ex.id} style={{ marginBottom: 14 }}>
                <div className="exercise-row">
                  <span className="exercise-name">{ex.name}</span>
                  <span className="exercise-target">
                    {ex.target_sets}x{ex.reps_is_max ? "max" : ex.target_reps}
                  </span>
                </div>
                <label>Reps por série (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: 10, 8, 6"
                  value={repsByExercise[ex.id] ?? ""}
                  onChange={(e) =>
                    setRepsByExercise((prev) => ({
                      ...prev,
                      [ex.id]: e.target.value,
                    }))
                  }
                />
                <label>Sensação (1 a 10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={ratingByExercise[ex.id] ?? ""}
                  onChange={(e) =>
                    setRatingByExercise((prev) => ({
                      ...prev,
                      [ex.id]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <label htmlFor="overallRating">Avaliação geral do treino (1 a 10)</label>
        <input
          id="overallRating"
          type="number"
          min={1}
          max={10}
          value={overallRating}
          onChange={(e) => setOverallRating(e.target.value)}
        />

        <label htmlFor="note">Notas</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Como correu, dores, dificuldades..."
        />

        <button className="primary" type="submit" disabled={saving}>
          {saving ? "A guardar..." : "Guardar treino"}
        </button>
        {savedMsg && <p className="muted">Treino guardado.</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <BottomNav />
    </main>
  );
}
