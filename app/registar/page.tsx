"use client";

import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ExerciseIllustration from "@/app/components/ExerciseIllustration";
import { POSE_BY_KEY } from "@/lib/poses";
import type { Exercise, PreState } from "@/lib/types";
import { PRE_STATE_LABEL } from "@/lib/types";

type Step = "pre_state" | "mode" | "plan" | "rating" | "final";
type Mode = "rua" | "casa";

interface ExerciseState {
  done: boolean;
  open: boolean;
  repsSeguidas: string;
  repsPerSet: string[];
  note: string;
  rating: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function RegistarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetDate = searchParams.get("date") ?? todayISO();
  const [step, setStep] = useState<Step>("pre_state");
  const [preState, setPreState] = useState<PreState | null>(null);
  const [mode, setMode] = useState<Mode>("rua");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exState, setExState] = useState<Record<string, ExerciseState>>({});
  const [planChangeNote, setPlanChangeNote] = useState("");
  const [injuredThisSession, setInjuredThisSession] = useState(false);
  const [injuredAtId, setInjuredAtId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("exercises").select("*");
      setExercises((data as Exercise[]) ?? []);
    }
    load();
  }, []);

  const visibleExercises = exercises
    .filter((e) => e.mode === mode || e.mode === "ambos")
    .sort((a, b) => {
      const key = mode === "rua" ? "sort_order_rua" : "sort_order_casa";
      return (a[key] ?? 99) - (b[key] ?? 99);
    });

  function ensureState(ex: Exercise): ExerciseState {
    return (
      exState[ex.id] ?? {
        done: false,
        open: false,
        repsSeguidas: "",
        repsPerSet: Array(ex.target_sets).fill(""),
        note: "",
        rating: "",
      }
    );
  }

  function updateState(id: string, patch: Partial<ExerciseState>, ex: Exercise) {
    setExState((prev) => ({
      ...prev,
      [id]: { ...ensureState(ex), ...prev[id], ...patch },
    }));
  }

  function markInjuredHere(exId: string) {
    if (injuredAtId === exId) {
      // segundo clique: desfaz o que o primeiro clique fez
      setInjuredThisSession(false);
      setInjuredAtId(null);
      const idx = visibleExercises.findIndex((e) => e.id === exId);
      if (idx === -1) return;
      setExState((prev) => {
        const next = { ...prev };
        for (let i = idx + 1; i < visibleExercises.length; i++) {
          const laterEx = visibleExercises[i];
          next[laterEx.id] = { ...ensureState(laterEx), ...next[laterEx.id], done: false };
        }
        return next;
      });
      return;
    }
    setInjuredThisSession(true);
    setInjuredAtId(exId);
    const idx = visibleExercises.findIndex((e) => e.id === exId);
    if (idx === -1) return;
    setExState((prev) => {
      const next = { ...prev };
      for (let i = idx + 1; i < visibleExercises.length; i++) {
        const laterEx = visibleExercises[i];
        next[laterEx.id] = { ...ensureState(laterEx), ...next[laterEx.id], done: true };
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const ratings = visibleExercises
      .map((ex) => exState[ex.id]?.rating)
      .filter((r): r is string => r !== undefined && r !== "")
      .map((r) => Number(r));
    const overallRating =
      ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : null;

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .upsert(
        {
          date: targetDate,
          mode,
          pre_state: preState,
          overall_rating: overallRating,
          plan_change_note: planChangeNote || null,
          injured: injuredThisSession,
        },
        { onConflict: "date" }
      )
      .select()
      .single();

    if (sessionError || !sessionRow) {
      setError(sessionError?.message ?? "Erro ao guardar a sessão.");
      setSaving(false);
      return;
    }

    await supabase
      .from("session_exercises")
      .delete()
      .eq("session_id", sessionRow.id);

    const rows = visibleExercises.map((ex) => {
      const s = ensureState(ex);
      return {
        session_id: sessionRow.id,
        exercise_id: ex.id,
        done: s.done,
        reps_seguidas: s.repsSeguidas ? Number(s.repsSeguidas) : null,
        reps_per_set: s.repsPerSet
          .map((v) => parseInt(v, 10))
          .filter((n) => !Number.isNaN(n)),
        rating: s.rating ? Number(s.rating) : null,
        note: s.note || null,
      };
    });

    const { error: rowsError } = await supabase
      .from("session_exercises")
      .insert(rows);

    setSaving(false);
    if (rowsError) {
      setError(rowsError.message);
      return;
    }
    setStep("final");
  }

  if (step === "pre_state") {
    return (
      <main>
        <Link href="/" className="back-link">
          ← Voltar
        </Link>
        <div className="eyebrow">Calistenia</div>
        {targetDate !== todayISO() && (
          <p className="muted" style={{ marginTop: -8, marginBottom: 12 }}>
            A registar o treino de {targetDate.split("-").reverse().join("/")}
          </p>
        )}
        <h2>Antes deste treino, como estás?</h2>
        {(Object.keys(PRE_STATE_LABEL) as PreState[]).map((k) => (
          <button
            key={k}
            className="action-btn dark"
            style={{ background: preState === k ? "var(--ember)" : undefined }}
            onClick={() => {
              setPreState(k);
              setStep("mode");
            }}
          >
            {PRE_STATE_LABEL[k]}
          </button>
        ))}
      </main>
    );
  }

  if (step === "mode") {
    return (
      <main>
        <button className="back-link" onClick={() => setStep("pre_state")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          ← Voltar
        </button>
        <div className="eyebrow">Calistenia</div>
        <h2>Rua ou casa?</h2>
        <button className="action-btn dark" onClick={() => { setMode("rua"); setStep("plan"); }}>
          Rua
        </button>
        <button className="action-btn moss" onClick={() => { setMode("casa"); setStep("plan"); }}>
          Casa
        </button>
      </main>
    );
  }

  if (step === "plan") {
    return (
      <main>
        <button className="back-link" onClick={() => setStep("mode")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          ← Voltar
        </button>
        <div className="eyebrow">Calistenia · {mode}</div>
        <h2>Plano de hoje</h2>

        {visibleExercises.map((ex) => {
          const s = ensureState(ex);
          const pose = POSE_BY_KEY[ex.key] ?? "flexao";
          return (
            <div key={ex.id} className={`card exercise-card ${s.done ? "faded" : ""}`}>
              <div className="card-header">
                <div>
                  <span className={`exercise-name ${s.done ? "exercise-name-strike" : ""}`}>
                    {ex.name}
                  </span>
                  <div className="exercise-target">
                    {ex.target_sets}x{ex.reps_is_max ? "máx" : ex.target_reps}
                  </div>
                </div>
                <button
                  className={`done-toggle ${s.done ? "done" : ""}`}
                  onClick={() => updateState(ex.id, { done: !s.done }, ex)}
                  aria-label="Marcar como feito"
                >
                  {s.done ? "✓" : ""}
                </button>
              </div>

              <ExerciseIllustration pose={pose} />

              {ex.nota_tecnica && <p className="muted">{ex.nota_tecnica}</p>}
              {ex.video_url && (
                <a className="video-link" href={ex.video_url} target="_blank" rel="noreferrer">
                  Ver vídeo de referência →
                </a>
              )}

              <button
                className="ghost-btn"
                style={{
                  marginTop: 10,
                  background: "transparent",
                  border: "1px solid var(--line)",
                  borderRadius: 5,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
                onClick={() => updateState(ex.id, { open: !s.open }, ex)}
              >
                {s.open ? "Fechar" : "Anotar"}
              </button>

              {s.open && (
                <div style={{ marginTop: 10 }}>
                  <label>
                    {ex.reps_is_max ? "Segundos aguentados" : "Repetições seguidas"}
                  </label>
                  <input
                    type="number"
                    value={s.repsSeguidas}
                    onChange={(e) => updateState(ex.id, { repsSeguidas: e.target.value }, ex)}
                  />
                  {Array.from({ length: ex.target_sets }).map((_, i) => (
                    <div key={i}>
                      <label>Série {i + 1}</label>
                      <input
                        type="number"
                        value={s.repsPerSet[i] ?? ""}
                        onChange={(e) => {
                          const next = [...s.repsPerSet];
                          next[i] = e.target.value;
                          updateState(ex.id, { repsPerSet: next }, ex);
                        }}
                      />
                    </div>
                  ))}
                  <label>Nota</label>
                  <textarea
                    value={s.note}
                    onChange={(e) => updateState(ex.id, { note: e.target.value }, ex)}
                  />
                  <button
                    type="button"
                    onClick={() => markInjuredHere(ex.id)}
                    style={{
                      width: "100%",
                      padding: 12,
                      marginTop: 10,
                      borderRadius: 3,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: "#ffffff",
                      border: "2px solid var(--danger)",
                      color: "var(--danger)",
                    }}
                  >
                    ✚ {injuredAtId === ex.id ? "Desfazer" : "Já me rasguei todo"}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <button className="primary" onClick={() => setStep("rating")}>
          Acabar treino
        </button>
      </main>
    );
  }

  if (step === "rating") {
    return (
      <main>
        <button className="back-link" onClick={() => setStep("plan")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          ← Voltar
        </button>
        <div className="eyebrow">Calistenia</div>
        <h2>Avaliação do treino</h2>

        {visibleExercises.map((ex) => {
          const s = ensureState(ex);
          return (
            <div key={ex.id} className="card">
              <span className="exercise-name">{ex.name}</span>
              <div className="score-grid">
                {Array.from({ length: 11 }).map((_, n) => (
                  <button
                    key={n}
                    type="button"
                    className={`score-btn ${Number(s.rating) === n ? "active" : ""}`}
                    onClick={() => updateState(ex.id, { rating: String(n) }, ex)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <label>
                {ex.reps_is_max ? "Segundos aguentados" : "Repetições seguidas"}
              </label>
              <input
                type="number"
                value={s.repsSeguidas}
                onChange={(e) => updateState(ex.id, { repsSeguidas: e.target.value }, ex)}
              />
              {Array.from({ length: ex.target_sets }).map((_, i) => (
                <div key={i}>
                  <label>Série {i + 1}</label>
                  <input
                    type="number"
                    value={s.repsPerSet[i] ?? ""}
                    onChange={(e) => {
                      const next = [...s.repsPerSet];
                      next[i] = e.target.value;
                      updateState(ex.id, { repsPerSet: next }, ex);
                    }}
                  />
                </div>
              ))}
              <label>Nota</label>
              <textarea
                value={s.note}
                onChange={(e) => updateState(ex.id, { note: e.target.value }, ex)}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setInjuredThisSession((v) => !v)}
          style={{
            width: "100%",
            padding: 14,
            marginTop: 6,
            marginBottom: 6,
            borderRadius: 3,
            fontWeight: 700,
            cursor: "pointer",
            background: "#ffffff",
            border: "2px solid var(--danger)",
            color: "var(--danger)",
          }}
        >
          ✚ {injuredThisSession ? "Desfazer" : "Magoei-me neste treino"}
        </button>

        <label htmlFor="planChange">Queres fazer alguma alteração ao plano?</label>
        <textarea
          id="planChange"
          value={planChangeNote}
          onChange={(e) => setPlanChangeNote(e.target.value)}
          placeholder="Opcional"
        />

        <button className="primary" onClick={handleSave} disabled={saving}>
          {saving ? "A guardar..." : "Guardar treino"}
        </button>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="final-screen">
      <div className="final-top">Treino acabado</div>
      <div className="final-center">Bom descanso</div>
      <div>
        <div className="final-bottom">Amanhã há mais.</div>
        <button className="primary" onClick={() => router.push("/")}>
          Voltar ao início
        </button>
      </div>
    </main>
  );
}

export default function RegistarPage() {
  return (
    <Suspense fallback={<main><p className="muted">A carregar...</p></main>}>
      <RegistarInner />
    </Suspense>
  );
}
