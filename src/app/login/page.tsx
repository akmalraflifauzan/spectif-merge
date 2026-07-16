"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      // Daftar akun baru. `data: { username }` disimpan ke user_metadata,
      // nanti dipakai sebagai nama tampilan di leaderboard.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      // Login dengan email + password.
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/game");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-emerald-200 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-extrabold text-indigo-900">
          {mode === "login" ? "Masuk" : "Daftar"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          {mode === "signup" && (
            <label className="text-sm font-semibold text-indigo-900">
              Username
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nama di leaderboard"
                className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </label>
          )}

          <label className="text-sm font-semibold text-indigo-900">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-sm font-semibold text-indigo-900">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimal 6 karakter"
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mt-3 text-sm text-indigo-700 hover:underline"
        >
          {mode === "login"
            ? "Belum punya akun? Daftar"
            : "Sudah punya akun? Masuk"}
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/game" className="text-indigo-700 hover:underline">
            Main sebagai tamu
          </Link>
          <Link href="/" className="text-indigo-700 hover:underline">
            Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}
