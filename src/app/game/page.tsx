"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import GameCanvas from "@/components/GameCanvas";
import { LEVELS, ROUND_BLOCKS } from "@/lib/game/config";
import { useBestScore } from "@/hooks/useBestScore";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { submitScore } from "@/lib/leaderboard";

/** Pratinjau satu blok (dipakai di panel Next Up). */
function BlockPreview({ level }: { level: number }) {
  const spec = LEVELS[level];
  return (
    <div className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spec.sprite}
        alt={spec.name}
        className={`h-10 w-10 border-2 border-black/60 object-cover sm:h-12 sm:w-12 ${
          ROUND_BLOCKS ? "rounded-full" : ""
        }`}
      />
      <span className="mc-text text-[10px] sm:text-xs">{spec.name}</span>
    </div>
  );
}

/** Panel "Next Up" — dipakai dua kali (bar atas di mobile, kolom kanan di desktop). */
function NextPanel({ level }: { level: number }) {
  return (
    <div className="mc-panel flex flex-1 flex-col items-center justify-center gap-1 p-2 sm:p-3">
      <h2 className="mc-text text-[10px] sm:text-xs">NEXT UP</h2>
      <BlockPreview level={level} />
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
  const handleQueueChange = useCallback((_cur: number, nxt: number) => {
    setNext(nxt);
  }, []);

  const handleScoreChange = useCallback((s: number) => {
    setScore(s);
  }, []);

  const { user } = useUser();
  const username = (user?.user_metadata?.username as string) ?? null;

  // Tidak perlu ref apa pun di sini: GameCanvas selalu memanggil versi TERBARU
  // dari callback ini, jadi `user` yang dibaca dijamin yang terkini.
  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameOver(true);
      submit(finalScore); // best score lokal (localStorage)

      // Kalau login, kirim juga ke leaderboard Supabase.
      if (user) {
        const name = username ?? user.email?.split("@")[0] ?? "Pemain";
        submitScore(user.id, name, finalScore).catch((err) =>
          console.error("Gagal submit skor:", err),
        );
      }
    },
    [submit, user, username],
  );

  function restart() {
    setGameOver(false);
    setScore(0);
    setRunId((r) => r + 1);
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-3 p-3 sm:gap-4 sm:p-6">
      {/* Header */}
      <div className="flex w-full  items-center justify-between gap-2">
        <Link href="/" className="mc-text w-1/2 text-lg underline">
          &lt; Kembali
        </Link>
        <h1 className="mc-text w-full text-lg text-center font-bold sm:text-2xl">
          Tekan di area BUCKET untuk menaruh bola
        </h1>
        {user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="mc-text w-1/2 text-right truncate text-lg underline"
          >
            {username ?? "Akun"} · Keluar
          </button>
        ) : (
          <Link
            href="/login"
            className="mc-text w-1/2 text-right text-lg underline"
          >
            Login
          </Link>
        )}
      </div>

      {/* Layar sempit: panel jadi bar horizontal di atas canvas.
          Layar lebar (lg+): panel jadi kolom kiri & kanan mengapit canvas. */}
      <div className="flex w-full max-w-5xl flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-center">
        {/* KIRI (desktop) / BAR ATAS (mobile) */}
        <div className="flex w-full max-w-[560px] flex-row gap-2 lg:w-44 lg:max-w-none lg:flex-col lg:gap-3">
          <div className="mc-panel flex-1 p-2 text-center sm:p-3">
            <h2 className="mc-text text-[10px] sm:text-xs">SCORE</h2>
            <p className="mc-text text-xl font-bold tabular-nums text-yellow-300 sm:text-3xl">
              {score}
            </p>
            <h3 className="mc-text mt-1 text-[10px] sm:text-xs">BEST</h3>
            <p className="mc-text text-sm font-bold tabular-nums sm:text-lg">
              {best}
            </p>
          </div>

          {/* Next Up ikut di bar atas hanya saat layar sempit. */}
          <div className="flex flex-1 lg:hidden">
            <NextPanel level={next} />
          </div>

          <Link
            href="/leaderboard"
            className="mc-btn hidden p-2 text-center text-xs lg:block"
          >
            Leaderboard
          </Link>
        </div>

        {/* CANVAS — menyusut mengikuti lebar layar, physics tetap sama. */}
        <div className="relative w-full max-w-[560px]">
          <GameCanvas
            key={runId}
            onQueueChange={handleQueueChange}
            onScoreChange={handleScoreChange}
            onGameOver={handleGameOver}
          />

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-4">
              <p className="mc-text text-2xl font-bold sm:text-3xl">
                GAME OVER
              </p>
              <p className="mc-text text-sm sm:text-base">
                Skor:{" "}
                <span className="tabular-nums text-yellow-300">{score}</span>
              </p>
              <p className="mc-text text-xs">
                Best: <span className="tabular-nums">{best}</span>
                {score >= best && score > 0 && " — Rekor baru!"}
              </p>
              <button
                onClick={restart}
                className="mc-btn mc-btn-primary px-6 py-2"
              >
                Main Lagi
              </button>
              <Link href="/leaderboard" className="mc-text text-xs underline">
                Lihat Leaderboard
              </Link>
            </div>
          )}
        </div>

        {/* KANAN — hanya tampil di layar lebar. */}
        <div className="hidden w-44 flex-col gap-3 lg:flex">
          <NextPanel level={next} />
        </div>
      </div>

      {/* Tombol leaderboard versi mobile (di bawah canvas). */}
      <Link
        href="/leaderboard"
        className="mc-btn w-full max-w-[560px] p-2 text-center text-xs lg:hidden"
      >
        Leaderboard
      </Link>
    </main>
  );
}
