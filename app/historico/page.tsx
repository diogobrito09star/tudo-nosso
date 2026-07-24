"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BottomNav from "@/app/components/BottomNav";
import type { Session, Exercise } from "@/lib/types";

interface SessionExerciseRow {
  id: string;
  session_id: string;
  exercise_id: string;
  reps_per_set: number[];
  rating: number | null;
  exercises: Exercise;
}

export default function HistoricoPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SessionExerciseRow[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("date", { ascending: false });
      setSessions((data as Session[]) ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleExpand(sessionId: string) {
    if (expanded === sessionId) {
      setExpanded(null);
      return;
    }
    setExpanded(sessionId);
    if (!details[sessionId]) {
      const { data } = await supabase
        .from("session_exercises")
        .select("*, exercises(*)")
        .eq("session_id", sessionId);
      setDetails((prev) => ({
        ...prev,
        [sessionId]: (data as SessionExerciseRow[]) ?? [],
      }));
    }
  }

  function formatDate(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <main>
      <div className="eyebrow">Tudo Nosso</div>
      <h1>Histórico</h1>

      {loading && <p className="muted">A carregar...</p>}
      {!loading && sessions.length === 0 && (
        <p className="muted">Ainda sem treinos registados.</p>
      )}

      {sessions.map((s) => (
        <div key={s.id} className="card">
          <div
            className="session-item"
            style={{ cursor: "pointer", border: "none", padding: 0 }}
            onClick={() => toggleExpand(s.id)}
          >
            <div>
              <span className="session-date">{formatDate(s.date)}</span>{" "}
              <span className={`tag ${s.mode}`}>{s.mode}</span>
            </div>
            <div>
              {s.overall_rating && (
                <span className="exercise-target">{s.overall_rating}/10</span>
              )}
            </div>
          </div>
          {s.note && <p className="muted" style={{ marginTop: 8 }}>{s.note}</p>}

          {expanded === s.id && (
            <div style={{ marginTop: 10 }}>
              {(details[s.id] ?? []).map((row) => (
                <div key={row.id} className="exercise-row">
                  <span className="exercise-name">{row.exercises?.name}</span>
                  <span className="exercise-target">
                    {row.reps_per_set.join("-")}
                    {row.rating ? ` · ${row.rating}/10` : ""}
                  </span>
                </div>
              ))}
              {(details[s.id] ?? []).length === 0 && (
                <p className="muted">Sem exercícios registados neste dia.</p>
              )}
            </div>
          )}
        </div>
      ))}

      <BottomNav />
    </main>
  );
}
