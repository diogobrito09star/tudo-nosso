"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@/lib/types";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function DescansoPage() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, Session>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restType, setRestType] = useState<"descanso" | "magoado">("descanso");
  const [saving, setSaving] = useState(false);

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
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0

  const cells = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstWeekday, daysInMonth]);

  function toggleDay(day: number) {
    const iso = isoOf(year, month, day);
    const existing = sessionsByDate[iso];
    if (existing && existing.mode !== "descanso" && existing.mode !== "magoado") return; // bloqueado, já tem treino
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }

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

  async function handleSave() {
    if (selected.size === 0) {
      router.push("/historico");
      return;
    }
    setSaving(true);
    const rows = Array.from(selected).map((date) => ({
      date,
      mode: restType,
      overall_rating: null,
    }));
    await supabase.from("sessions").upsert(rows, { onConflict: "date" });
    setSaving(false);
    router.push("/historico");
  }

  return (
    <main>
      <Link href="/" className="back-link">
        ← Voltar
      </Link>
      <div className="eyebrow">Calistenia</div>
      <h2>Hoje é descanso</h2>
      <p className="muted">
        Podes marcar vários dias de uma vez. Dias já com treino registado
        ficam bloqueados.
      </p>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${restType === "descanso" ? "active" : ""}`}
          style={restType === "descanso" ? { background: "var(--moss)", borderColor: "var(--moss)" } : undefined}
          onClick={() => setRestType("descanso")}
        >
          Descanso
        </button>
        <button
          type="button"
          className={`tab ${restType === "magoado" ? "active" : ""}`}
          style={
            restType === "magoado"
              ? { background: "#ffffff", borderColor: "var(--danger)", color: "var(--danger)" }
              : undefined
          }
          onClick={() => setRestType("magoado")}
        >
          Já me rasguei todo
        </button>
      </div>

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
          const existing = sessionsByDate[iso];
          const blocked = !!existing && existing.mode !== "descanso" && existing.mode !== "magoado";
          const isDescanso = existing?.mode === "descanso";
          const isMagoado = existing?.mode === "magoado";
          const isSelected = selected.has(iso);
          const classes = [
            "calendar-day",
            blocked ? "blocked treino" : "",
            isDescanso ? "descanso" : "",
            isMagoado ? "magoado" : "",
            isSelected ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={i} className={classes} onClick={() => !blocked && toggleDay(day)}>
              <span>{day}</span>
              {isMagoado && <span className="magoado-cross">✚</span>}
            </div>
          );
        })}
      </div>

      <button className="primary" onClick={handleSave} disabled={saving}>
        {saving ? "A guardar..." : restType === "magoado" ? "Guardar dias magoado" : "Guardar descansos"}
      </button>
    </main>
  );
}
