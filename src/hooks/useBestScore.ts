import { useCallback, useSyncExternalStore } from "react";

// Key lama sengaja DIPERTAHANKAN meski tema sudah berganti — menggantinya akan
// membuat rekor pemain yang sudah tersimpan hilang.
const STORAGE_KEY = "petriBestScore";

/**
 * Best score disimpan di localStorage — sebuah "sumber data di luar React".
 *
 * Untuk kasus seperti ini React menyediakan `useSyncExternalStore`. Ini lebih
 * tepat daripada useState + useEffect, karena:
 *  - Tidak memanggil setState di dalam effect (yang memicu render berantai).
 *  - Punya `getServerSnapshot` khusus untuk SSR, jadi tidak ada masalah
 *    "localStorage tidak ada di server" maupun hydration mismatch.
 *  - Perubahan otomatis tersiar ke SEMUA komponen yang memakai hook ini.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Event "storage" menyala kalau tab LAIN mengubah nilainya -> ikut sinkron.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Baca nilai terkini (dipanggil React saat render di browser). */
function getSnapshot() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

/** Nilai saat render di server, di mana localStorage belum ada. */
function getServerSnapshot() {
  return 0;
}

/** Beri tahu semua pemakai hook bahwa nilainya berubah. */
function emitChange() {
  for (const l of listeners) l();
}

export function useBestScore() {
  const best = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Panggil dengan skor akhir; hanya menimpa rekor kalau lebih tinggi.
  const submit = useCallback((score: number) => {
    if (score > getSnapshot()) {
      localStorage.setItem(STORAGE_KEY, String(score));
      emitChange();
    }
  }, []);

  return { best, submit };
}
