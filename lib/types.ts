export type ExerciseMode = "rua" | "casa" | "ambos";
export type SessionMode = "rua" | "casa" | "descanso" | "magoado";
export type PreState = "bem" | "beca_partido" | "fodidinho" | "fodido";

export interface Exercise {
  id: string;
  key: string;
  name: string;
  mode: ExerciseMode;
  target_sets: number;
  target_reps: number | null;
  reps_is_max: boolean;
  sort_order_rua: number | null;
  sort_order_casa: number | null;
  nota_tecnica: string | null;
  video_url: string | null;
}

export interface SessionExerciseInput {
  exercise_id: string;
  reps_per_set: number[];
  reps_seguidas: number | null;
  rating: number | null;
  note: string;
  done: boolean;
}

export interface Session {
  id: string;
  date: string;
  mode: SessionMode;
  pre_state: PreState | null;
  overall_rating: number | null;
  note: string | null;
  plan_change_note: string | null;
  created_at: string;
}

export interface WeighIn {
  id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export const PRE_STATE_LABEL: Record<PreState, string> = {
  bem: "Estou bem",
  beca_partido: "Estou uma beca partido",
  fodidinho: "Estou fodidinho",
  fodido: "Estou todo fodido",
};
