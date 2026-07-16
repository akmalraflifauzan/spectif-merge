import { LEVELS } from "./config";

/**
 * Memuat semua gambar sekali di awal, lalu dipakai berulang tiap frame.
 *
 * Gambar dimuat secara ASINKRON. Karena itu di game loop kita selalu cek
 * `isReady(img)` dulu — kalau belum selesai dimuat, kita gambar lingkaran
 * warna sebagai cadangan supaya game tetap jalan (tidak nge-blank).
 */
export type Sprites = {
  blocks: HTMLImageElement[];
  bucket: HTMLImageElement;
};

export function loadSprites(): Sprites {
  const blocks = LEVELS.map((spec) => {
    const img = new Image();
    img.src = spec.sprite;
    return img;
  });

  const bucket = new Image();
  bucket.src = "/Bucket.webp";

  return { blocks, bucket };
}

/** Gambar sudah siap dipakai? (sudah selesai dimuat & tidak gagal) */
export function isReady(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0;
}
