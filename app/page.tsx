"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      router.replace(data.session ? "/registar" : "/login");
    }
    check();
  }, [router]);

  return (
    <main>
      <p className="muted">A carregar...</p>
    </main>
  );
}
