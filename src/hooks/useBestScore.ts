import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "petriBestScore";

/**
 * Menyimpan & membaca "best score" dari localStorage browser.
 *
 * Catatan Next.js: kode ini jalan di dua tempat — server (saat render awal) dan
 * browser. `localStorage` HANYA ada di browser. Karena itu kita TIDAK membacanya
 * saat render, melainkan di dalam useEffect (yang hanya jalan di browser).
 */
export function useBestScore() {
  const [best, setBest] = useState(0);

  // Baca rekor tersimpan sekali saat komponen pertama kali tampil di browser.
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setBest(parseInt(raw, 10) || 0);
  }, []);

  // Panggil dengan skor akhir; hanya menimpa rekor kalau lebih tinggi.
  const submit = useCallback((score: number) => {
    setBest((prev) => {
      if (score > prev) {
        localStorage.setItem(STORAGE_KEY, String(score));
        return score;
      }
      return prev;
    });
  }, []);

  return { best, submit };
}
