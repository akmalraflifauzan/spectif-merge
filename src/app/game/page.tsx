"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import GameCanvas from "@/components/GameCanvas";
import { LEVELS } from "@/lib/game/config";
import { useBestScore } from "@/hooks/useBestScore";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { submitScore } from "@/lib/leaderboard";

/** Kotak kecil pratinjau satu mikroba (dipakai di panel Next Up). */
function MicrobePreview({ level }: { level: number }) {
  const spec = LEVELS[level];
  const size = Math.min(56, spec.radius * 1.6);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="rounded-full border border-black/10"
        style={{ width: size, height: size, background: spec.color }}
      />
      <span className="text-xs text-indigo-800/80">{spec.name}</span>
    </div>
  );
}

export default function GamePage() {
  const [next, setNext] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  // runId dipakai sebagai `key` canvas. Menaikkannya = React membuang canvas lama
  // (menjalankan cleanup) lalu memasang yang baru dari nol -> reset total.
  const [runId, setRunId] = useState(0);
  const { best, submit } = useBestScore();

  // useCallback: identitas fungsi ini tetap stabil antar-render, jadi
  // useEffect di GameCanvas nggak ke-restart tiap kali skor/antrian berubah.
  // "Sekarang" tak lagi ditampilkan (sudah diwakili hantu di canvas),
  // jadi kita cuma butuh nilai `next`.
  const handleQueueChange = useCallback((_cur: number, nxt: number) => {
    setNext(nxt);
  }, []);

  const handleScoreChange = useCallback((s: number) => {
    setScore(s);
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameOver(true);
      submit(finalScore); // best score lokal (localStorage)

      // Kalau login, kirim juga ke leaderboard Supabase.
      const u = userRef.current;
      if (u) {
        const name = usernameRef.current ?? u.email?.split("@")[0] ?? "Pemain";
        submitScore(u.id, name, finalScore).catch((err) =>
          console.error("Gagal submit skor:", err),
        );
      }
    },
    [submit],
  );

  const { user } = useUser();
  const username = (user?.user_metadata?.username as string) ?? null;
  // Simpan user & username terbaru di ref. (Lihat penjelasan di bawah.)
  const userRef = useRef(user);
  const usernameRef = useRef(username);
  useEffect(() => {
    userRef.current = user;
    usernameRef.current = username;
  }, [user, username]);

  function restart() {
    setGameOver(false);
    setScore(0);
    setRunId((r) => r + 1);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-emerald-200 p-6">
      <div className="flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-700 hover:underline"
        >
          ← Kembali
        </Link>
        <h1 className="text-3xl font-bold text-indigo-900">Petri Merge</h1>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-semibold text-indigo-700 hover:underline"
          >
            {username ?? "Logout"} · Keluar
          </button>
        ) : (
          <Link
            href="/login"
            className="text-sm font-semibold text-indigo-700 hover:underline"
          >
            Login
          </Link>
        )}
      </div>
      <p className="text-sm text-indigo-800/80">
        Jangan sampai tumpukan melewati garis merah!
      </p>

      <div className="flex items-start gap-6">
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white/70 p-4 shadow text-center">
            <h2 className="text-sm font-bold text-indigo-900">SCORE</h2>
            <p className="text-3xl font-extrabold text-indigo-700 tabular-nums">
              {score}
            </p>
            <p className="mt-2 text-xs font-semibold text-indigo-800/70">
              Best Score
            </p>
            <p className="text-xl font-bold text-indigo-600 tabular-nums">
              {best}
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="rounded-2xl bg-white/70 p-3 text-center text-sm font-bold text-indigo-800 shadow transition hover:bg-white"
          >
            🏆 Papan Peringkat
          </Link>
        </aside>

        {/* relative: supaya overlay game over bisa menutup tepat di atas canvas */}
        <div className="relative">
          <GameCanvas
            key={runId}
            onQueueChange={handleQueueChange}
            onScoreChange={handleScoreChange}
            onGameOver={handleGameOver}
          />

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/50 text-white">
              <p className="text-3xl font-extrabold">Game Over</p>
              <p className="text-lg">
                Skor: <span className="font-bold tabular-nums">{score}</span>
              </p>
              <p className="text-sm text-white/80">
                Best: <span className="font-bold tabular-nums">{best}</span>
                {score >= best && score > 0 && " 🎉 Rekor baru!"}
              </p>
              <button
                onClick={restart}
                className="rounded-full bg-emerald-400 px-6 py-2 font-bold text-indigo-900 shadow transition hover:bg-emerald-300"
              >
                Main Lagi
              </button>
              <Link
                href="/leaderboard"
                className="text-sm text-white/90 underline hover:text-white"
              >
                Lihat Papan Peringkat
              </Link>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white/70 p-4 shadow">
            <h2 className="mb-2 text-center text-sm font-bold text-indigo-900">
              Next Up!
            </h2>
            <MicrobePreview level={next} />
          </div>
        </aside>
      </div>
    </main>
  );
}
