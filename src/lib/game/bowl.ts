import Matter from "matter-js";
import { WORLD, BOWL } from "./config";

/**
 * Membuat lantai melengkung ("mangkuk") supaya bola menggelinding ke tengah.
 *
 * Matter.js tidak punya lantai melengkung bawaan — body statis selalu berbentuk
 * kotak/poligon. Jadi kita rakit kurva dari banyak SEGMEN kotak kecil yang
 * dimiringkan mengikuti bentuk parabola. Semakin banyak segmen, semakin mulus.
 *
 * Kembaliannya:
 *  - curveYAt(x): tinggi permukaan lantai pada posisi x (buat keperluan lain nanti).
 *  - drawFloor(ctx): menggambar lantai melengkung yang MULUS (bukan bergerigi).
 */
export function createBowl(world: Matter.World) {
  const t = WORLD.wallThickness;
  const innerLeft = t;
  const innerRight = WORLD.width - t;
  const cx = WORLD.width / 2;
  const halfInner = (innerRight - innerLeft) / 2;

  // Titik terdalam mangkuk (paling bawah), sedikit di atas dasar canvas.
  const centerY = WORLD.height - t;

  /** Permukaan lantai berbentuk parabola: tengah paling rendah, pinggir naik. */
  function curveYAt(x: number) {
    const clamped = Math.max(innerLeft, Math.min(innerRight, x));
    const nx = (clamped - cx) / halfInner; // -1 di kiri, 0 di tengah, +1 di kanan
    return centerY - BOWL.depth * nx * nx;
  }

  // --- Rakit collision dari segmen-segmen kotak kecil ---------------------
  const step = (innerRight - innerLeft) / BOWL.segments;
  for (let i = 0; i < BOWL.segments; i++) {
    const x0 = innerLeft + i * step;
    const x1 = x0 + step;
    const y0 = curveYAt(x0);
    const y1 = curveYAt(x1);

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const angle = Math.atan2(y1 - y0, x1 - x0); // kemiringan segmen ini
    const length = Math.hypot(x1 - x0, y1 - y0) + 2; // +2 = overlap, cegah celah

    // Geser pusat kotak tegak lurus ke bawah permukaan, biar SISI ATAS kotak
    // pas menempel di kurva (bukan tengahnya).
    const centerX = midX - Math.sin(angle) * (BOWL.thickness / 2);
    const centerYSeg = midY + Math.cos(angle) * (BOWL.thickness / 2);

    const segment = Matter.Bodies.rectangle(
      centerX,
      centerYSeg,
      length,
      BOWL.thickness,
      { isStatic: true, angle, friction: 0.3, label: "floor" },
    );
    Matter.Composite.add(world, segment);
  }

  /** Gambar lantai melengkung yang mulus dengan menyusuri kurva-nya. */
  function drawFloor(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(innerLeft, curveYAt(innerLeft));
    const samples = 40;
    for (let i = 1; i <= samples; i++) {
      const x = innerLeft + ((innerRight - innerLeft) * i) / samples;
      ctx.lineTo(x, curveYAt(x));
    }
    // Tutup path ke dasar canvas supaya jadi area terisi.
    ctx.lineTo(innerRight, WORLD.height);
    ctx.lineTo(innerLeft, WORLD.height);
    ctx.closePath();
    ctx.fillStyle = "#9fc6a0";
    ctx.fill();
  }

  return { curveYAt, drawFloor };
}
