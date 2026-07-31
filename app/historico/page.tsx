"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Session, Exercise } from "@/lib/types";
import { PRE_STATE_LABEL } from "@/lib/types";

interface SessionExerciseRow {
  id: string;
  reps_per_set: number[];
  reps_seguidas: number | null;
  rating: number | null;
  note: string | null;
  exercises: Exercise;
}

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function bandClass(rating: number | null): string {
  if (rating === null) return "";
  if (rating <= 2) return "band-low";
  if (rating <= 5) return "band-midlow";
  if (rating <= 7) return "band-midhigh";
  return "band-high";
}

export default function HistoricoPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, Session>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [details, setDetails] = useState<SessionExerciseRow[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("sessions").select("*");
      const map: Record<string, Session> = {};
      (data as Session[] | null)?.forEach((s) => {
        map[s.date] = s;
      });
      setSessionsByDate(map);
    }
    load();
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstWeekday, daysInMonth]);

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  async function openDay(iso: string) {
    const session = sessionsByDate[iso];
    setSelectedDate(iso);
    if (!session) {
      setDetails([]);
      return;
    }
    if (session.mode === "descanso" || session.mode === "magoado") {
      setDetails([]);
      return;
    }
    setLoadingDetails(true);
    const { data } = await supabase
      .from("session_exercises")
      .select("*, exercises(*)")
      .eq("session_id", session.id);
    setDetails((data as SessionExerciseRow[]) ?? []);
    setLoadingDetails(false);
  }

  const selectedSession = selectedDate ? sessionsByDate[selectedDate] : null;

  return (
    <main>
      <Link href="/" className="back-link">
        ← Voltar
      </Link>
      <div className="eyebrow">Calistenia</div>
      <h2>Registos</h2>

      <div className="calendar-nav">
        <button onClick={() => changeMonth(-1)}>←</button>
        <strong>
          {new Date(year, month, 1).toLocaleDateString("pt-PT", {
            month: "long",
            year: "numeric",
          })}
        </strong>
        <button onClick={() => changeMonth(1)}>→</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="calendar-weekday">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="calendar-day empty" />;
          const iso = isoOf(year, month, day);
          const s = sessionsByDate[iso];
          const isTraining = !!s && s.mode !== "descanso" && s.mode !== "magoado";
          const classes = [
            "calendar-day",
            s?.mode === "descanso" ? "descanso" : "",
            s?.mode === "magoado" ? "magoado" : "",
            isTraining ? "treino" : "",
            selectedDate === iso ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={i} className={classes} onClick={() => openDay(iso)}>
              <span>{day}</span>
              {s?.mode === "descanso" && <span>😴</span>}
              {s?.mode === "magoado" && <span className="magoado-cross">✚</span>}
              {isTraining && s.injured && <span className="injury-badge">✚</span>}
              {isTraining && s.overall_rating && (
                <span style={{ fontSize: 10 }}>{s.overall_rating}/10</span>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && !selectedSession && (
        <div className="card" style={{ marginTop: 20 }}>
          <strong>{selectedDate.split("-").reverse().join("/")}</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            Ainda não há nada registado neste dia.
          </p>
          <Link href={`/registar?date=${selectedDate}`} className="action-btn dark" style={{ marginTop: 10 }}>
            Registar treino neste dia
          </Link>
        </div>
      )}

      {selectedSession && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <strong>{selectedDate}</strong>{" "}
            <span className={`tag ${selectedSession.mode}`}>{selectedSession.mode}</span>{" "}
            {selectedSession.pre_state && (
              <span className="muted">{PRE_STATE_LABEL[selectedSession.pre_state]}</span>
            )}
          </div>

          {(selectedSession.mode === "descanso" || selectedSession.mode === "magoado") && (
            <p className="muted" style={{ marginTop: 8 }}>
              {selectedSession.mode === "descanso" ? "Dia de descanso." : "Dia em que se magoou."}
            </p>
          )}

          {selectedSession.mode !== "descanso" && selectedSession.mode !== "magoado" && (
            <>
              {loadingDetails && <p className="muted">A carregar...</p>}
              {!loadingDetails &&
                details.map((row) => {
                  const parts: string[] = [];
                  if (row.reps_seguidas !== null) parts.push(`${row.reps_seguidas} seguidas`);
                  if (row.reps_per_set.length > 0) {
                    parts.push(
                      row.reps_per_set.map((r, i) => `Série ${i + 1}: ${r}`).join(", ")
                    );
                  }
                  if (row.note) parts.push(row.note);
                  return (
                    <div key={row.id} className="exercise-row">
                      <div>
                        <div className="exercise-name">{row.exercises?.name}</div>
                        {parts.length > 0 && (
                          <div className="muted">{parts.join(" · ")}</div>
                        )}
                      </div>
                      <span className="exercise-target">
                        {row.rating !== null ? `${row.rating}/10` : "—"}
                      </span>
                    </div>
                  );
                })}
              {selectedSession.plan_change_note && (
                <p className="muted" style={{ marginTop: 10 }}>
                  Pedido de alteração: {selectedSession.plan_change_note}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
