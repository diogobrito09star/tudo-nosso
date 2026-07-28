export type ExerciseMode = "rua" | "casa" | "ambos";
export type SessionMode = "rua" | "casa" | "descanso";

export interface Exercise {
  id: string;
  key: string;
  name: string;
  mode: ExerciseMode;
  target_sets: number;
  target_reps: number | null;
  reps_is_max: boolean;
  sort_order: number;
}

export interface SessionExerciseInput {
  exercise_id: string;
  reps_per_set: number[];
  rating: number | null;
  note: string;
}

export interface Session {
  id: string;
  date: string;
  mode: SessionMode;
  overall_rating: number | null;
  note: string | null;
  created_at: string;
}
