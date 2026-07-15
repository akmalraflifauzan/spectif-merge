// Semua angka "aturan main" dikumpulkan di sini, biar gampang di-tuning
// tanpa perlu ngubek-ubek kode game-nya.

/** Ukuran wadah (koordinat dunia game, bukan pixel layar). */
export const WORLD = {
  width: 480,
  height: 480,
  wallThickness: 12, // tebal dinding & lantai
};

/** Seberapa "berat" gravitasinya. 1 = default Matter.js. */
export const GRAVITY_Y = 1;

/** Bentuk dasar wadah yang melengkung seperti mangkuk.
 *  depth = seberapa dalam cekungannya (pinggir lebih tinggi dari tengah).
 *  segments = jumlah potongan kotak kecil penyusun kurva (makin banyak makin mulus).
 *  thickness = tebal "daging" lantai di bawah permukaan kurva. */
export const BOWL = {
  depth: 70,
  segments: 28,
  thickness: 20,
};

/** Level tertinggi yang boleh MUNCUL dari drop. Level di atas ini hanya
 *  bisa didapat lewat merge — inilah yang bikin game-nya menantang. */
export const DROP_MAX_LEVEL = 2;

/** Tinggi "ruang atas" (headroom) di dalam canvas untuk zona drop.
 *  Dinding wadah baru dimulai di bawah ini, jadi bola & hantu tampil DI ATAS
 *  wadah, dan puncak wadah = garis batas game over. */
export const HEADROOM = 110;

/** Garis tempat mikroba "dipegang" sebelum dijatuhkan — di tengah headroom,
 *  jadi tampil di atas garis batas. */
export const DROP_LINE_Y = 34;

/** Jeda minimal antar drop (ms), biar tombol nggak bisa di-spam. */
export const DROP_COOLDOWN_MS = 350;

/** Garis batas = puncak wadah (tepat di bawah headroom). Kalau mikroba yang
 *  sudah diam menonjol di atas garis ini lebih lama dari grace period -> game over. */
export const GAME_OVER_LINE_Y = HEADROOM;

/** Berapa lama (ms) mikroba boleh "nangkring" di atas garis sebelum kalah. */
export const GAME_OVER_GRACE_MS = 1000;

/** Ambang kecepatan untuk dianggap "diam". Bola yang lagi jatuh kecepatannya
 *  di atas ini, jadi nggak ikut dihitung sebagai penyebab game over. */
export const SETTLE_SPEED = 0.8;

/**
 * Rantai evolusi mikroba: index = level.
 * Level 0 dimerge dengan level 0 -> jadi level 1, dst.
 * Untuk sekarang cukup radius + warna. Nanti di Tahap 6 kita ganti pakai gambar.
 */
export type MicrobeLevel = {
  radius: number;
  color: string;
  name: string;
  /** Skor yang didapat saat mikroba level INI TERBENTUK dari hasil merge. */
  score: number;
};

export const LEVELS: MicrobeLevel[] = [
  { radius: 22, color: "#f7b2d9", name: "Virus", score: 0 },
  { radius: 28, color: "#f79ac0", name: "Fag", score: 3 },
  { radius: 36, color: "#f7c948", name: "Bakteri", score: 6 },
  { radius: 44, color: "#8ad46a", name: "Alga", score: 10 },
  { radius: 54, color: "#4cc9c0", name: "Amoeba", score: 15 },
  { radius: 64, color: "#4aa3e0", name: "Protozoa", score: 21 },
  { radius: 76, color: "#6f7ae8", name: "Ragi", score: 28 },
  { radius: 90, color: "#a06ae8", name: "Spora", score: 36 },
  { radius: 110, color: "#e86ab5", name: "Koloni", score: 55 },
];

/** Level tertinggi (nggak bisa di-merge lebih jauh). */
export const MAX_LEVEL = LEVELS.length - 1;
