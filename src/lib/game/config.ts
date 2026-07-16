// Semua angka "aturan main" dikumpulkan di sini, biar gampang di-tuning
// tanpa perlu ngubek-ubek kode game-nya.

/** Ukuran wadah (koordinat dunia game, bukan pixel layar). */
export const WORLD = {
  width: 720,
  height: 600,
  wallThickness: 12, // tebal dinding & lantai
};

/** Seberapa "berat" gravitasinya. 1 = default Matter.js. */
export const GRAVITY_Y = 1;

/** Bentuk blok saat digambar:
 *  - true  = tekstur dipotong jadi LINGKARAN, persis seukuran body physics.
 *            Visual = area tabrakan, jadi tumpukan terlihat paling "benar".
 *  - false = tekstur digambar KOTAK seperti blok Minecraft asli.
 *            Lebih otentik, tapi sudut kotak menonjol keluar lingkaran
 *            tabrakan, jadi antar-blok bisa terlihat sedikit tumpang-tindih.
 *  Ganti true/false lalu simpan untuk membandingkan. */
export const ROUND_BLOCKS = true;

/** Tingkat kepekatan blok yang sedang "dipegang" di headroom (pratinjau bidikan).
 *  1   = pekat penuh, sama seperti blok yang sudah jatuh.
 *  0.5 = setengah transparan (kesan "hantu").
 *  Naikkan kalau mau lebih terang/jelas. */
export const GHOST_ALPHA = 1;

/** Seberapa besar sprite blok digambar, relatif terhadap diameter body physics.
 *  1 = seukuran diameter (sudut kotak sedikit menonjol keluar lingkaran).
 *  0.85 = sedikit lebih kecil, tumpukan terlihat lebih rapat/rapi. */
export const SPRITE_SCALE = 1;

/** Tampilkan garis bantu kalibrasi di atas canvas:
 *  - MAGENTA = batas canvas (diatur lewat WORLD.width/height)
 *  - ORANYE  = area GAMBAR bucket (diatur lewat BUCKET_DRAW)
 *  - CYAN    = rongga bucket / area bermain (diatur lewat BUCKET)
 *  - KUNING  = lantai melengkung (diatur lewat BOWL.depth)
 *  Set ke `false` kalau sudah pas. */
export const DEBUG_OUTLINE = false;

/** Area GAMBAR bucket di dalam canvas — FRAKSI (0..1) terhadap lebar/tinggi canvas.
 *
 *  Ini TERPISAH dari ukuran canvas, jadi kamu bisa meninggikan / mengecilkan /
 *  menggeser gambar bucket tanpa mengubah WORLD.width/height sama sekali.
 *
 *  Tips: gambar bucket aslinya persegi. Kalau area ini dibuat LEBIH SEMPIT
 *  (left naik, right turun) tapi tinggi tetap, bucket akan terlihat lebih JANGKUNG.
 *  Kalau `top` diturunkan angkanya (mis. 0.02), bucket memanjang ke atas. */
export const BUCKET_DRAW = {
  left: -0.01,
  right: 1.01,
  top: 0.13,
  bottom: 1.03,
};

/** Kalibrasi rongga dalam bucket (area bermain / dinding physics).
 *  Semua nilai = FRAKSI (0..1) terhadap lebar & tinggi CANVAS.
 *  Setel sampai kotak CYAN menempel di sisi dalam gambar bucket. */
export const BUCKET = {
  /** Sisi dalam kiri & kanan rongga bucket. */
  innerLeft: 0.18,
  innerRight: 0.82,
  /** Dasar dalam rongga bucket. */
  innerBottom: 0.9,
};

/** Bentuk dasar wadah yang melengkung seperti mangkuk.
 *  depth = seberapa dalam cekungannya (pinggir lebih tinggi dari tengah).
 *  segments = jumlah potongan kotak kecil penyusun kurva (makin banyak makin mulus).
 *  thickness = tebal "daging" lantai di bawah permukaan kurva. */
export const BOWL = {
  depth: 100,
  segments: 30,
  thickness: 50,
};

/** Level tertinggi yang boleh MUNCUL dari drop. Level di atas ini hanya
 *  bisa didapat lewat merge — inilah yang bikin game-nya menantang. */
export const DROP_MAX_LEVEL = 2;

/** Tinggi "ruang atas" (headroom) di dalam canvas untuk zona drop.
 *  Dinding wadah baru dimulai di bawah ini, jadi bola & hantu tampil DI ATAS
 *  wadah, dan puncak wadah = garis batas game over. */
export const HEADROOM = 110;

/** Garis tempat blok "dipegang" sebelum dijatuhkan — di tengah headroom,
 *  jadi tampil di atas garis batas. */
export const DROP_LINE_Y = 34;

/** Jeda minimal antar drop (ms), biar tombol nggak bisa di-spam. */
export const DROP_COOLDOWN_MS = 350;

/** Garis batas = puncak wadah (tepat di bawah headroom). Kalau blok yang
 *  sudah diam menonjol di atas garis ini lebih lama dari grace period -> game over. */
export const GAME_OVER_LINE_Y = HEADROOM;

/** Berapa lama (ms) blok boleh "nangkring" di atas garis sebelum kalah. */
export const GAME_OVER_GRACE_MS = 1000;

/** Ambang kecepatan untuk dianggap "diam". Bola yang lagi jatuh kecepatannya
 *  di atas ini, jadi nggak ikut dihitung sebagai penyebab game over. */
export const SETTLE_SPEED = 0.8;

/**
 * Rantai blok Minecraft: index = level.
 * Level 0 di-merge dengan level 0 -> jadi level 1, dst.
 * Netherite (level terakhir) tidak bisa di-merge lagi.
 *
 * `sprite` = path gambar di folder public/ (dipakai untuk digambar di canvas).
 * `color` tetap dipertahankan sebagai warna cadangan selagi gambar dimuat.
 */
export type BlockLevel = {
  radius: number;
  color: string;
  name: string;
  /** Skor yang didapat saat blok level INI TERBENTUK dari hasil merge. */
  score: number;
  sprite: string;
};

export const LEVELS: BlockLevel[] = [
  {
    radius: 22,
    color: "#8b5a3c",
    name: "Dirt",
    score: 0,
    sprite: "/Dirt.webp",
  },
  {
    radius: 28,
    color: "#8f8f8f",
    name: "Stone",
    score: 3,
    sprite: "/Stone.webp",
  },
  {
    radius: 36,
    color: "#2f2f2f",
    name: "Coal",
    score: 6,
    sprite: "/Block_of_Coal.webp",
  },
  {
    radius: 44,
    color: "#c1663f",
    name: "Copper",
    score: 10,
    sprite: "/Block_of_Copper.webp",
  },
  {
    radius: 54,
    color: "#d8d8d8",
    name: "Iron",
    score: 15,
    sprite: "/Block_of_Iron.webp",
  },
  {
    radius: 64,
    color: "#f6d33c",
    name: "Gold",
    score: 21,
    sprite: "/Block_of_Gold.webp",
  },
  {
    radius: 76,
    color: "#41d97e",
    name: "Emerald",
    score: 28,
    sprite: "/Block_of_Emerald.webp",
  },
  {
    radius: 90,
    color: "#4aedd9",
    name: "Diamond",
    score: 36,
    sprite: "/Block_of_Diamond.webp",
  },
  {
    radius: 110,
    color: "#4a4450",
    name: "Netherite",
    score: 55,
    sprite: "/Block_of_Netherite.webp",
  },
];

/** Level tertinggi (nggak bisa di-merge lebih jauh). */
export const MAX_LEVEL = LEVELS.length - 1;
