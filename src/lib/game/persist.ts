// Menyimpan & memuat "foto" (snapshot) keadaan permainan ke localStorage,
// supaya kalau halaman di-refresh, permainan bisa dilanjutkan (bukan mulai dari 0).

const STORAGE_KEY = "petriGameState";

/** Data satu bola yang disimpan. */
export type SavedBody = {
  x: number;
  y: number;
  vx: number; // kecepatan horizontal
  vy: number; // kecepatan vertikal
  angle: number; // sudut rotasi
  av: number; // kecepatan rotasi (angular velocity)
  level: number;
};

/** Keseluruhan keadaan permainan pada satu momen. */
export type SavedState = {
  score: number;
  current: number; // level yang sedang dipegang
  next: number; // level di antrian "Next Up"
  bodies: SavedBody[];
};

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SavedState;
    // Validasi minimal: kalau bentuknya nggak sesuai, anggap tidak ada.
    if (!s || !Array.isArray(s.bodies)) return null;
    return s;
  } catch {
    return null; // JSON rusak dsb -> mulai fresh saja
  }
}

export function saveState(state: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage penuh / diblokir -> abaikan, jangan sampai bikin game crash.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
