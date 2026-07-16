"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/**
 * Melacak user Supabase yang sedang login.
 * - getUser(): ambil user saat ini (sekali, saat komponen dipasang).
 * - onAuthStateChange(): dengarkan perubahan login/logout secara real-time,
 *   jadi UI otomatis update tanpa refresh.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Berhenti mendengarkan saat komponen dilepas (hindari kebocoran).
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
