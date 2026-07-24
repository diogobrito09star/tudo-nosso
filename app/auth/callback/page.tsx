"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userId = data.session.user.id;
        const email = data.session.user.email ?? "";
        await supabase
          .from("profiles")
          .upsert(
            { id: userId, display_name: email.split("@")[0] },
            { onConflict: "id", ignoreDuplicates: true }
          );
      }
      router.replace("/registar");
    }
    finish();
  }, [router]);

  return (
    <main>
      <p className="muted">A entrar...</p>
    </main>
  );
}
