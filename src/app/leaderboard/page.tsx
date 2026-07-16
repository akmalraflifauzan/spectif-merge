"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTopScores, type LeaderboardRow } from "@/lib/leaderboard";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopScores(10)
      .then(setRows)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center gap-5 p-4 sm:p-6">
      <div className="flex w-full max-w-md items-center justify-between pt-4">
        <Link href="/" className="mc-text text-md underline">
          &lt; Kembali
        </Link>
        <h1 className="mc-text text-xl sm:text-3xl font-bold">Leaderboard</h1>
        <span className="w-16" />
      </div>

      <div className="mc-panel w-full max-w-md p-4">
        {loading && (
          <p className="mc-text p-4 text-center text-sm">Memuat...</p>
        )}
        {error && (
          <p className="p-4 text-center text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && rows.length === 0 && (
          <p className="mc-text p-4 text-center text-sm">
            Belum ada skor. Jadilah yang pertama!
          </p>
        )}

        {!loading && !error && rows.length > 0 && (
          <ol className="flex flex-col gap-1">
            {rows.map((row, i) => (
              <li
                key={row.user_id}
                className="mc-text flex items-center justify-between gap-2 px-2 py-2 text-sm odd:bg-white/10"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="w-6 shrink-0 text-center">{i + 1}.</span>
                  <span className="truncate">{row.username}</span>
                </span>
                <span className="shrink-0 tabular-nums text-yellow-300">
                  {row.best_score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Link href="/game" className="mc-btn mc-btn-primary px-8 py-2.5">
        Play
      </Link>
    </main>
  );
}
