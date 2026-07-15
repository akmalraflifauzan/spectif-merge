"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // KERANGKA: belum ada autentikasi. Untuk sekarang tombol "Masuk" hanya
  // mengarahkan ke game supaya alurnya bisa ditelusuri. Logika Supabase Auth
  // akan dipasang di Tahap 7.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/game");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-emerald-200 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-extrabold text-indigo-900">Masuk</h1>

        {/* Penanda jujur bahwa ini belum berfungsi. */}
        <p className="mt-1 mb-4 rounded-lg bg-amber-100 px-3 py-2 text-xs text-amber-800">
          Kerangka UI — login belum aktif. Backend menyusul di Tahap 7.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-indigo-900">
            Email
            <input
              type="email"
              required
              placeholder="kamu@email.com"
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-sm font-semibold text-indigo-900">
            Password
            <input
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white shadow transition hover:bg-indigo-500"
          >
            Masuk
          </button>
        </form>

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
