import { supabase } from "./supabase/client";

export type LeaderboardRow = {
  user_id: string;
  username: string;
  best_score: number;
  updated_at: string;
};

/** Simpan skor ke leaderboard — hanya menimpa kalau lebih tinggi dari rekor lama. */
export async function submitScore(
  userId: string,
  username: string,
  score: number,
) {
  // 1) Baca rekor lama user ini (kalau ada).
  const { data: existing, error: readErr } = await supabase
    .from("scores")
    .select("best_score")
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) throw readErr;

  // 2) Kalau rekor lama sudah >= skor baru, tak perlu tulis apa-apa.
  if (existing && existing.best_score >= score) return;

  // 3) upsert = INSERT kalau belum ada baris, UPDATE kalau sudah ada
  //    (berdasarkan primary key user_id).
  const { error } = await supabase.from("scores").upsert({
    user_id: userId,
    username,
    best_score: score,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Ambil N skor tertinggi untuk papan peringkat (dipakai di 7.7). */
export async function fetchTopScores(limit = 10): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("user_id, username, best_score, updated_at")
    .order("best_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
