"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import type { Session, Exercise, WeighIn } from "@/lib/types";
import { PRE_STATE_LABEL } from "@/lib/types";

interface ExerciseLogRow {
  id: string;
  exercise_id: string;
  reps_seguidas: number | null;
  rating: number | null;
  exercises: Exercise;
  sessions: { date: string } | null;
}

type GeneralView = "dia" | "mes" | "ano";

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt1(n: number | null) {
  return n === null ? "—" : n.toFixed(1);
}

export default function EvolucaoPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [logs, setLogs] = useState<ExerciseLogRow[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [weighIns, setWeighIns] = useState<WeighIn[]>([]);
  const [loading, setLoading] = useState(true);

  const [generalView, setGeneralView] = useState<GeneralView>("mes");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [exerciseMetric, setExerciseMetric] = useState<"rating" | "reps">("rating");

  const [showMore, setShowMore] = useState(false);
  const [showAllDeltas, setShowAllDeltas] = useState(false);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    async function load() {
      const [sessionsRes, logsRes, exercisesRes, weighRes] = await Promise.all([
        supabase.from("sessions").select("*"),
        supabase
          .from("session_exercises")
          .select("*, exercises(*), sessions(date)"),
        supabase.from("exercises").select("*"),
        supabase.from("weigh_ins").select("*").order("date", { ascending: true }),
      ]);
      setSessions((sessionsRes.data as Session[]) ?? []);
      setLogs((logsRes.data as unknown as ExerciseLogRow[]) ?? []);
      setExercises((exercisesRes.data as Exercise[]) ?? []);
      setWeighIns((weighRes.data as WeighIn[]) ?? []);
      if (exercisesRes.data && exercisesRes.data.length > 0) {
        setSelectedExerciseId((exercisesRes.data as Exercise[])[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  const trainingSessions = sessions.filter((s) => s.mode !== "descanso" && s.mode !== "magoado");
  const restSessions = sessions.filter((s) => s.mode === "descanso");
  const magoadoSessions = sessions.filter((s) => s.mode === "magoado");
  const injuredTrainingSessions = sessions.filter(
    (s) => s.mode !== "descanso" && s.mode !== "magoado" && s.injured
  );
  const totalInjuryDays = magoadoSessions.length + injuredTrainingSessions.length;

  const allDates = sessions.map((s) => s.date).sort();
  const firstDate = allDates[0];
  const lastDate = allDates[allDates.length - 1];
  const totalDaysCount =
    firstDate && lastDate
      ? Math.max(
          1,
          Math.round(
            (new Date(lastDate).getTime() - new Date(firstDate).getTime()) /
              86400000
          ) + 1
        )
      : 0;
  const totalDays = totalDaysCount;
  const periodo =
    totalDaysCount > 0
      ? `${totalDaysCount} ${totalDaysCount === 1 ? "dia" : "dias"}`
      : "Ainda sem registos";
  const mediaGeral = avg(
    trainingSessions
      .map((s) => s.overall_rating)
      .filter((n): n is number => n !== null)
  );
  const mediaDescansoSemana =
    totalDays > 0 ? (restSessions.length / totalDays) * 7 : null;

  const dailyPoints = trainingSessions
    .filter((s) => s.overall_rating !== null)
    .map((s) => ({ date: s.date, value: s.overall_rating as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthlyPoints = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    dailyPoints.forEach((p) => {
      const ym = p.date.slice(0, 7);
      if (yearFilter && !ym.startsWith(String(yearFilter))) return;
      buckets[ym] = buckets[ym] ?? [];
      buckets[ym].push(p.value);
    });
    return Object.entries(buckets)
      .map(([ym, vals]) => ({ key: ym, value: avg(vals) ?? 0, vals }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [dailyPoints, yearFilter]);

  const yearlyPoints = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    dailyPoints.forEach((p) => {
      const y = p.date.slice(0, 4);
      buckets[y] = buckets[y] ?? [];
      buckets[y].push(p.value);
    });
    return Object.entries(buckets)
      .map(([y, vals]) => ({ key: y, value: avg(vals) ?? 0, vals }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [dailyPoints]);

  const dayPoints = useMemo(() => {
    return dailyPoints.filter((p) => (monthFilter ? p.date.startsWith(monthFilter) : true));
  }, [dailyPoints, monthFilter]);

  function handleGeneralPointClick(point: { key?: string; date?: string }) {
    if (generalView === "ano" && point.key) {
      setYearFilter(Number(point.key));
      setGeneralView("mes");
    } else if (generalView === "mes" && point.key) {
      setMonthFilter(point.key);
      setGeneralView("dia");
    } else if (generalView === "dia" && point.date) {
      setSelectedDay(point.date);
    }
  }

  function ClickableDot(props: any) {
    const { cx, cy, payload } = props;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#f4f1ea"
        stroke="#c9622f"
        strokeWidth={2.5}
        style={{ cursor: "pointer" }}
        onClick={() => handleGeneralPointClick(payload)}
      />
    );
  }

  function DayTooltip({ active, payload }: any) {
    if (!active || !payload || !payload[0]) return null;
    const date: string = payload[0].payload.date;
    const session = sessions.find((s) => s.date === date);
    const dayRatings = logs
      .filter((l) => l.sessions?.date === date && l.rating !== null)
      .map((l) => l.rating as number);
    const best = dayRatings.length ? Math.max(...dayRatings) : null;
    const worst = dayRatings.length ? Math.min(...dayRatings) : null;
    return (
      <div
        style={{
          padding: 10,
          fontSize: 12,
          background: "#1b1210",
          border: "1px solid #3a2e29",
          borderRadius: 6,
          color: "#f4f1ea",
        }}
      >
        <div>Média: {fmt1(payload[0].payload.value)}</div>
        <div>Melhor nota: {fmt1(best)}</div>
        <div>Pior nota: {fmt1(worst)}</div>
        <div>
          Antes do treino:{" "}
          {session?.pre_state ? PRE_STATE_LABEL[session.pre_state] : "—"}
        </div>
      </div>
    );
  }

  function BucketTooltip({ active, payload }: any) {
    if (!active || !payload || !payload[0]) return null;
    const d = payload[0].payload;
    const vals: number[] = d.vals ?? [];
    const first = vals[0] ?? null;
    const last = vals[vals.length - 1] ?? null;
    return (
      <div
        style={{
          padding: 10,
          fontSize: 12,
          background: "#1b1210",
          border: "1px solid #3a2e29",
          borderRadius: 6,
          color: "#f4f1ea",
        }}
      >
        <div>Média do período: {fmt1(avg(vals))}</div>
        <div>Início do período: {fmt1(first)}</div>
        <div>Fim do período: {fmt1(last)}</div>
      </div>
    );
  }

  const selectedDaySession = selectedDay
    ? sessions.find((s) => s.date === selectedDay)
    : null;
  const selectedDayLogs = selectedDaySession
    ? logs.filter((l) => l.sessions?.date === selectedDay)
    : [];

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);
  const isFrog = selectedExercise?.key === "frog_position";

  const exerciseSeries = logs
    .filter((l) => l.exercise_id === selectedExerciseId)
    .map((l) => ({
      date: l.sessions?.date ?? "",
      rating: l.rating,
      reps: l.reps_seguidas,
    }))
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const perExerciseStats = useMemo(() => {
    return exercises.map((ex) => {
      const rows = logs
        .filter((l) => l.exercise_id === ex.id)
        .map((l) => ({ date: l.sessions?.date ?? "", rating: l.rating, reps: l.reps_seguidas }))
        .filter((r) => r.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      const ratings = rows.map((r) => r.rating).filter((n): n is number => n !== null);
      const reps = rows.map((r) => r.reps).filter((n): n is number => n !== null);

      const half = Math.ceil(ratings.length / 2);
      const ratingFirstHalf = avg(ratings.slice(0, half));
      const ratingSecondHalf = avg(ratings.slice(half));
      const ratingDelta =
        ratingFirstHalf !== null && ratingSecondHalf !== null
          ? ratingSecondHalf - ratingFirstHalf
          : null;

      const halfReps = Math.ceil(reps.length / 2);
      const repsFirstHalf = avg(reps.slice(0, halfReps));
      const repsSecondHalf = avg(reps.slice(halfReps));
      const repsDelta =
        repsFirstHalf !== null && repsSecondHalf !== null
          ? repsSecondHalf - repsFirstHalf
          : null;

      return {
        exercise: ex,
        avgRating: avg(ratings),
        ratingFirstHalf,
        ratingSecondHalf,
        ratingDelta,
        repsFirstHalf,
        repsSecondHalf,
        repsDelta,
      };
    });
  }, [exercises, logs]);

  const withAvg = perExerciseStats.filter((s) => s.avgRating !== null);
  const bestAvg = withAvg.length
    ? withAvg.reduce((a, b) => ((a.avgRating ?? 0) > (b.avgRating ?? 0) ? a : b))
    : null;
  const worstAvg = withAvg.length
    ? withAvg.reduce((a, b) => ((a.avgRating ?? 0) < (b.avgRating ?? 0) ? a : b))
    : null;

  const withRatingDelta = perExerciseStats.filter((s) => s.ratingDelta !== null);
  const mostImprovedScore = withRatingDelta.length
    ? withRatingDelta.reduce((a, b) => ((a.ratingDelta ?? 0) > (b.ratingDelta ?? 0) ? a : b))
    : null;
  const worstDeltaScore = withRatingDelta.length
    ? withRatingDelta.reduce((a, b) => ((a.ratingDelta ?? 0) < (b.ratingDelta ?? 0) ? a : b))
    : null;
  const somethingDeclined = worstDeltaScore && (worstDeltaScore.ratingDelta ?? 0) < 0;

  const withRepsDelta = perExerciseStats.filter((s) => s.repsDelta !== null);
  const mostImprovedReps = withRepsDelta.length
    ? withRepsDelta.reduce((a, b) => ((a.repsDelta ?? 0) > (b.repsDelta ?? 0) ? a : b))
    : null;

  const latestWeight = weighIns[weighIns.length - 1];
  const previousWeight = weighIns[weighIns.length - 2];

  async function handleSaveWeight() {
    if (!newWeight) return;
    setSavingWeight(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("weigh_ins")
      .insert({ date: today, weight_kg: Number(newWeight) })
      .select()
      .single();
    if (data) setWeighIns((prev) => [...prev, data as WeighIn]);
    setNewWeight("");
    setSavingWeight(false);
    setShowWeightForm(false);
  }

  if (loading) {
    return (
      <main>
        <Link href="/" className="back-link">
          ← Voltar
        </Link>
        <p className="muted">A carregar...</p>
      </main>
    );
  }

  const generalData =
    generalView === "ano" ? yearlyPoints : generalView === "mes" ? monthlyPoints : dayPoints;

  return (
    <main>
      <Link href="/" className="back-link">
        ← Voltar
      </Link>
      <div className="eyebrow">Calistenia</div>
      <h2>Evolução</h2>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{trainingSessions.length}</div>
          <div className="stat-label">Treinos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ fontSize: 14 }}>
            {periodo}
          </div>
          <div className="stat-label">Período</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{fmt1(mediaGeral)}</div>
          <div className="stat-label">Média</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{restSessions.length}</div>
          <div className="stat-label">Descansos</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{totalInjuryDays}</div>
          <div className="stat-label">Lesões</div>
        </div>
        <div className="stat-box" style={{ gridColumn: "span 2" }}>
          <div className="stat-value">{fmt1(mediaDescansoSemana)}</div>
          <div className="stat-label">Média de descanso / semana</div>
        </div>
      </div>

      <h2 style={{ fontSize: 20 }}>Gráfico geral</h2>
      <div className="tabs">
        {(["dia", "mes", "ano"] as GeneralView[]).map((v) => (
          <button
            key={v}
            className={`tab ${generalView === v ? "active" : ""}`}
            onClick={() => {
              setGeneralView(v);
              if (v === "ano") setYearFilter(null);
              if (v !== "dia") setSelectedDay(null);
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {yearFilter && generalView === "mes" && (
        <p className="muted">
          A ver só o ano de {yearFilter}.{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setYearFilter(null);
            }}
          >
            Limpar filtro
          </a>
        </p>
      )}
      {monthFilter && generalView === "dia" && (
        <p className="muted">
          A ver só o mês de {monthFilter}.{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setMonthFilter(null);
            }}
          >
            Limpar filtro
          </a>
        </p>
      )}

      <div className="chart-card">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={generalData}>
            <defs>
              <linearGradient id="fillGeneral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9622f" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#c9622f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={generalView === "dia" ? "date" : "key"} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            {generalView !== "dia" && <Tooltip content={<BucketTooltip />} />}
            {generalView === "dia" && <Tooltip content={<DayTooltip />} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#c9622f"
              strokeWidth={2.5}
              fill="url(#fillGeneral)"
              dot={<ClickableDot />}
              activeDot={<ClickableDot />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {generalView === "dia" && selectedDay && selectedDaySession && (
        <div className="card">
          <strong>{selectedDay}</strong>
          {selectedDayLogs.map((l) => (
            <div key={l.id} className="exercise-row">
              <span className="exercise-name">{l.exercises?.name}</span>
              <span className="exercise-target">
                {l.rating !== null ? `${l.rating}/10` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 20, marginTop: 30 }}>Gráfico por exercício</h2>
      <select
        value={selectedExerciseId}
        onChange={(e) => setSelectedExerciseId(e.target.value)}
        style={{ marginBottom: 14 }}
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      <div className="tabs">
        <button
          className={`tab ${exerciseMetric === "rating" ? "active" : ""}`}
          onClick={() => setExerciseMetric("rating")}
        >
          Pontuação
        </button>
        <button
          className={`tab ${exerciseMetric === "reps" ? "active" : ""}`}
          onClick={() => setExerciseMetric("reps")}
        >
          {isFrog ? "Segundos aguentados" : "Reps seguidas"}
        </button>
      </div>

      <div className="chart-card">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={exerciseSeries}>
            <defs>
              <linearGradient id="fillExercise" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9622f" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#c9622f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1b1210", border: "1px solid #3a2e29", color: "#f4f1ea" }} />
            <Area
              type="monotone"
              dataKey={exerciseMetric === "rating" ? "rating" : "reps"}
              stroke="#c9622f"
              strokeWidth={2.5}
              fill="url(#fillExercise)"
              dot={{ r: 4, fill: "#f4f1ea", stroke: "#c9622f", strokeWidth: 2.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <button
        style={{
          width: "100%",
          padding: 12,
          background: "transparent",
          border: "1px solid var(--line)",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 700,
          marginBottom: 20,
        }}
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? "Esconder mais dados" : "Ver mais dados"}
      </button>

      {showMore && (
        <div>
          <div className="card">
            <div className="exercise-row">
              <span>Melhor média</span>
              <span className="exercise-target">
                {bestAvg ? `${bestAvg.exercise.name} · ${fmt1(bestAvg.avgRating)}` : "—"}
              </span>
            </div>
            <div className="exercise-row">
              <span>Pior média</span>
              <span className="exercise-target">
                {worstAvg ? `${worstAvg.exercise.name} · ${fmt1(worstAvg.avgRating)}` : "—"}
              </span>
            </div>
            <div className="exercise-row">
              <span>O que mais subiu</span>
              <span className="exercise-target">
                {mostImprovedScore
                  ? `${mostImprovedScore.exercise.name} · ${fmt1(mostImprovedScore.ratingFirstHalf)} → ${fmt1(mostImprovedScore.ratingSecondHalf)}`
                  : "—"}
              </span>
            </div>
            <div className="exercise-row">
              <span>O que mais desceu</span>
              <span className="exercise-target">
                {somethingDeclined && worstDeltaScore
                  ? `${worstDeltaScore.exercise.name} · ${fmt1(worstDeltaScore.ratingFirstHalf)} → ${fmt1(worstDeltaScore.ratingSecondHalf)}`
                  : "Nada desceu, boa notícia"}
              </span>
            </div>
            <div className="exercise-row">
              <span>Mais subiu em reps seguidas</span>
              <span className="exercise-target">
                {mostImprovedReps
                  ? `${mostImprovedReps.exercise.name} · ${fmt1(mostImprovedReps.repsFirstHalf)} → ${fmt1(mostImprovedReps.repsSecondHalf)}`
                  : "—"}
              </span>
            </div>
          </div>

          <button
            style={{
              width: "100%",
              padding: 10,
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: 20,
            }}
            onClick={() => setShowAllDeltas((v) => !v)}
          >
            {showAllDeltas ? "Esconder lista completa" : "Ver todas as subidas e descidas"}
          </button>

          {showAllDeltas && (
            <div className="card">
              {perExerciseStats.map((s) => (
                <div key={s.exercise.id} className="exercise-row">
                  <span className="exercise-name">{s.exercise.name}</span>
                  <span className="exercise-target">
                    pont. {s.ratingDelta !== null ? s.ratingDelta.toFixed(1) : "—"} · reps{" "}
                    {s.repsDelta !== null ? s.repsDelta.toFixed(1) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Peso
            </div>
            {latestWeight ? (
              <>
                <div className="stat-value">{latestWeight.weight_kg} kg</div>
                {previousWeight && (
                  <p className="muted">
                    {previousWeight.weight_kg}kg ({previousWeight.date}) →{" "}
                    {latestWeight.weight_kg}kg ({latestWeight.date})
                  </p>
                )}
              </>
            ) : (
              <p className="muted">Ainda sem registos de peso.</p>
            )}

            {!showWeightForm && (
              <button className="primary" onClick={() => setShowWeightForm(true)}>
                Atualizar
              </button>
            )}
            {showWeightForm && (
              <div>
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <button className="primary" onClick={handleSaveWeight} disabled={savingWeight}>
                  {savingWeight ? "A guardar..." : "Guardar peso"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
