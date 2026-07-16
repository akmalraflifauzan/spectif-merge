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
      // dipakai sebagai nama tampilan di leaderboard.
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="mc-panel w-full max-w-sm p-5 sm:p-6">
        <h1 className="mc-text text-2xl font-bold">
          {mode === "login" ? "LOGIN" : "REGISTER"}
        </h1>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {mode === "signup" && (
            <label className="mc-text text-sm">
              Username
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nama di leaderboard"
                className="mc-input mt-1 px-3 py-2 text-sm"
              />
            </label>
          )}

          <label className="mc-text text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kamu@email.com"
              className="mc-input mt-1 px-3 py-2 text-sm"
            />
          </label>

          <label className="mc-text text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimal 6 karakter"
              className="mc-input mt-1 px-3 py-2 text-sm"
            />
          </label>

          {error && (
            <p className="border-4 border-black bg-red-900/80 px-3 py-2 text-xs">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mc-btn mc-btn-primary px-6 py-2.5"
          >
            {loading ? "Memproses..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="mc-text mt-4 text-xs underline"
        >
          {mode === "login"
            ? "Belum punya akun? Register"
            : "Sudah punya akun? Login"}
        </button>

        <div className="mc-text mt-4 flex items-center justify-between text-xs">
          <Link href="/game" className="underline">
            Play as guest
          </Link>
          <Link href="/" className="underline">
            Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}
