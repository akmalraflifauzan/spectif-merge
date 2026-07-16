import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="mc-text text-4xl sm:text-8xl font-bold tracking-wider">
          MC Ball Merge
        </h1>
        <p className="mc-text mt-3 text-md sm:text-base">
          Gabungkan bola, raih skor setinggi mungkin!
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-4">
        {/* Main dengan login -> ke halaman login */}
        <Link
          href="/login"
          className="mc-btn mc-btn-primary px-6 py-3 text-center text-lg"
        >
          Login
        </Link>

        {/* Main tanpa login -> langsung ke game */}
        <Link href="/game" className="mc-btn px-6 py-3 text-center text-lg">
          Play as guest
        </Link>

        <Link
          href="/leaderboard"
          className="mc-btn px-6 py-2 text-center text-lg"
        >
          Leaderboard
        </Link>
      </div>

      <p className="mc-text max-w-sm text-center text-md leading-relaxed">
        Login menyimpan skormu ke leaderboard. Guest hanya menyimpan rekor di
        device ini.
      </p>
    </main>
  );
}
