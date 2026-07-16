import Matter from "matter-js";
import { WORLD, BOWL, BUCKET, HEADROOM } from "./config";

/** Batas rongga dalam bucket (dihitung dari fraksi di config BUCKET). */
export function bucketCavity() {
  const left = BUCKET.innerLeft * WORLD.width;
  const right = BUCKET.innerRight * WORLD.width;
  const containerTop = HEADROOM;
  const containerHeight = WORLD.height - HEADROOM;
  const bottom = containerTop + BUCKET.innerBottom * containerHeight;
  return { left, right, top: containerTop, bottom };
}

/**
 * Lantai melengkung di dasar bucket supaya blok menggelinding ke tengah.
 *
 * Matter.js tidak punya lantai melengkung bawaan — body statis selalu
 * kotak/poligon. Jadi kurva dirakit dari banyak SEGMEN kotak kecil yang
 * dimiringkan mengikuti parabola.
 *
 * Catatan: sejak tema Minecraft, lantai TIDAK digambar (visual diambil alih
 * gambar bucket). Modul ini murni physics.
 */
export function createBowl(world: Matter.World) {
  const { left: innerLeft, right: innerRight, bottom } = bucketCavity();
  const cx = (innerLeft + innerRight) / 2;
  const halfInner = (innerRight - innerLeft) / 2;

  /** Permukaan lantai: tengah paling rendah, pinggir naik (parabola). */
  function curveYAt(x: number) {
    const clamped = Math.max(innerLeft, Math.min(innerRight, x));
    const nx = (clamped - cx) / halfInner; // -1 kiri, 0 tengah, +1 kanan
    return bottom - BOWL.depth * nx * nx;
  }

  const step = (innerRight - innerLeft) / BOWL.segments;
  for (let i = 0; i < BOWL.segments; i++) {
    const x0 = innerLeft + i * step;
    const x1 = x0 + step;
    const y0 = curveYAt(x0);
    const y1 = curveYAt(x1);

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const length = Math.hypot(x1 - x0, y1 - y0) + 2; // overlap kecil, cegah celah

    // Geser pusat kotak tegak lurus ke bawah permukaan, biar SISI ATAS kotak
    // pas menempel di kurva.
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

  return { curveYAt };
}
