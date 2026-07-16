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
    <main className="min-h-screen flex flex-col items-center gap-6 bg-gradient-to-b from-sky-200 to-emerald-200 p-6">
      <div className="flex w-full max-w-md items-center justify-between pt-4">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-700 hover:underline"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl font-extrabold text-indigo-900">
          Papan Peringkat
        </h1>
        <span className="w-16" />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white/80 p-4 shadow">
        {loading && (
          <p className="p-4 text-center text-indigo-800/70">Memuat...</p>
        )}
        {error && <p className="p-4 text-center text-red-600">{error}</p>}

        {!loading && !error && rows.length === 0 && (
          <p className="p-4 text-center text-indigo-800/70">
            Belum ada skor. Jadilah yang pertama!
          </p>
        )}

        {!loading && !error && rows.length > 0 && (
          <ol className="flex flex-col gap-1">
            {rows.map((row, i) => (
              <li
                key={row.user_id}
                className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-indigo-50/60"
              >
                <span className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-indigo-700">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </span>
                  <span className="font-semibold text-indigo-900">
                    {row.username}
                  </span>
                </span>
                <span className="font-bold tabular-nums text-indigo-700">
                  {row.best_score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Link
        href="/game"
        className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white shadow transition hover:bg-indigo-500"
      >
        Main
      </Link>
    </main>
  );
}
