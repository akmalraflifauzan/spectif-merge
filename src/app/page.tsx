import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 bg-gradient-to-b from-sky-200 to-emerald-200 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-indigo-900">Petri Merge</h1>
        <p className="mt-3 text-indigo-800/80">
          Gabungkan mikroba, raih skor setinggi mungkin!
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {/* Main dengan login -> ke halaman login (backend menyusul di Tahap 7) */}
        <Link
          href="/login"
          className="rounded-full bg-indigo-600 px-6 py-3 text-center font-bold text-white shadow transition hover:bg-indigo-500"
        >
          Main dengan Login
        </Link>

        {/* Main tanpa login -> langsung ke game */}
        <Link
          href="/game"
          className="rounded-full bg-white/80 px-6 py-3 text-center font-bold text-indigo-900 shadow transition hover:bg-white"
        >
          Main sebagai Tamu
        </Link>
        <Link
          href="/leaderboard"
          className="text-center text-sm font-semibold text-indigo-800/80 hover:underline"
        >
          Lihat Papan Peringkat
        </Link>
      </div>

      <p className="text-xs text-indigo-800/60">
        Login menyimpan skormu ke papan peringkat. Tamu hanya menyimpan rekor di
        perangkat ini.
      </p>
    </main>
  );
}
