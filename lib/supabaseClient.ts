import { createClient } from "@supabase/supabase-js";

// O URL do projeto e a publishable key são seguros para expor no cliente
// (não são segredos, são o equivalente a uma chave pública de API).
// As variáveis de ambiente têm prioridade se estiverem definidas na Vercel.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ucvsjqjhulebuqzmklze.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_qvLCIHKZoKn-mVB15UD-bQ_pAybfYiZ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
