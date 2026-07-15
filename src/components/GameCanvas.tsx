"use client";

import { useEffect, useRef } from "react";
import Matter from "matter-js";
import {
  WORLD,
  GRAVITY_Y,
  LEVELS,
  MAX_LEVEL,
  DROP_MAX_LEVEL,
  DROP_LINE_Y,
  DROP_COOLDOWN_MS,
  GAME_OVER_LINE_Y,
  GAME_OVER_GRACE_MS,
  SETTLE_SPEED,
  HEADROOM,
} from "@/lib/game/config";
import { createBowl } from "@/lib/game/bowl";
import {
  loadState,
  saveState,
  clearState,
  type SavedBody,
} from "@/lib/game/persist";

type Props = {
  /** Dipanggil tiap antrian berubah, biar panel "Next Up" di luar canvas ikut update. */
  onQueueChange?: (current: number, next: number) => void;
  /** Dipanggil tiap skor berubah. */
  onScoreChange?: (score: number) => void;
  /** Dipanggil sekali saat game over, membawa skor akhir ronde ini. */
  onGameOver?: (finalScore: number) => void;
};

/** Data yang kita titipkan di setiap body mikroba.
 *  aboveSince = kapan (timestamp) bola ini MULAI diam di atas garis batas. */
type MicrobePlugin = { level: number; merged?: boolean; aboveSince?: number };

/** Ambil level acak yang boleh muncul dari drop (0..DROP_MAX_LEVEL). */
function randomDropLevel() {
  return Math.floor(Math.random() * (DROP_MAX_LEVEL + 1));
}

export default function GameCanvas({
  onQueueChange,
  onScoreChange,
  onGameOver,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Dunia physics (sama seperti Tahap 1) ----------------------------
    const engine = Matter.Engine.create();
    engine.gravity.y = GRAVITY_Y;
    const world = engine.world;

    const t = WORLD.wallThickness;
    const wallOptions = { isStatic: true };
    // Lantai melengkung (mangkuk) supaya bola menggelinding ke tengah.
    const bowl = createBowl(world);
    // Dinding hanya menutup area WADAH (mulai dari HEADROOM ke bawah), sehingga
    // ada ruang kosong di atas untuk zona drop.
    const wallHeight = WORLD.height - HEADROOM;
    const leftWall = Matter.Bodies.rectangle(
      t / 2,
      HEADROOM + wallHeight / 2,
      t,
      wallHeight,
      wallOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      WORLD.width - t / 2,
      HEADROOM + wallHeight / 2,
      t,
      wallHeight,
      wallOptions,
    );
    Matter.Composite.add(world, [leftWall, rightWall]);

    // --- State kontrol drop ----------------------------------------------
    // Kita simpan di variabel biasa (bukan useState) karena ini dibaca/ditulis
    // 60x per detik di dalam loop — pakai state React malah bikin re-render terus.
    let currentLevel = randomDropLevel(); // yang sedang dipegang
    let nextLevel = randomDropLevel(); // yang muncul di panel "Next Up"
    let aimX = WORLD.width / 2; // posisi X bidikan (ikut mouse)
    let canDrop = true; // false selama cooldown
    let lastDropAt = 0;
    let score = 0;
    let gameOver = false;

    // Antrian pasangan yang akan di-merge. Diisi saat collisionStart,
    // TAPI diproses setelah Engine.update — bukan di tengah perhitungan physics.
    const mergeQueue: [Matter.Body, Matter.Body][] = [];

    function spawnMicrobe(x: number, y: number, level: number) {
      const spec = LEVELS[level];
      const body = Matter.Bodies.circle(x, y, spec.radius, {
        restitution: 0.2,
        friction: 0.4,
        density: 0.001,
        label: "microbe",
      });
      const plugin: MicrobePlugin = { level };
      body.plugin = plugin;
      Matter.Composite.add(world, body);
      return body;
    }

    // --- Pulihkan permainan sebelumnya (kalau ada) ------------------------
    // Kalau halaman baru saja di-refresh, muat kembali posisi bola, skor,
    // dan antrian dari snapshot terakhir.
    const saved = loadState();
    if (saved) {
      score = saved.score;
      currentLevel = saved.current;
      nextLevel = saved.next;
      for (const sb of saved.bodies) {
        const body = spawnMicrobe(sb.x, sb.y, sb.level);
        // Kembalikan juga kecepatan & rotasinya, biar physics-nya mulus
        // (nggak "loncat" seolah semua baru dijatuhkan).
        Matter.Body.setVelocity(body, { x: sb.vx, y: sb.vy });
        Matter.Body.setAngle(body, sb.angle);
        Matter.Body.setAngularVelocity(body, sb.av);
      }
    }

    // Kabari React soal antrian & skor awal (setelah kemungkinan dipulihkan).
    onQueueChange?.(currentLevel, nextLevel);
    onScoreChange?.(score);

    // --- Simpan snapshot secara berkala & saat halaman ditutup ------------
    function snapshot() {
      const bodies: SavedBody[] = [];
      for (const b of Matter.Composite.allBodies(world)) {
        if (b.label !== "microbe") continue;
        const p = b.plugin as MicrobePlugin;
        bodies.push({
          x: b.position.x,
          y: b.position.y,
          vx: b.velocity.x,
          vy: b.velocity.y,
          angle: b.angle,
          av: b.angularVelocity,
          level: p.level,
        });
      }
      return { score, current: currentLevel, next: nextLevel, bodies };
    }

    function persist() {
      if (gameOver) return; // jangan simpan papan yang sudah mati
      saveState(snapshot());
    }

    // Simpan tiap 700ms selama bermain...
    const saveTimer = window.setInterval(persist, 700);
    // ...dan sekali lagi tepat sebelum tab ditutup / di-refresh.
    window.addEventListener("pagehide", persist);

    /** Posisi Y saat bola "dipegang" di headroom. Menyesuaikan radius supaya
     *  bola sebesar apa pun tetap muat (sisi atasnya nggak nembus canvas). */
    function heldY(level: number) {
      return Math.max(DROP_LINE_Y, LEVELS[level].radius + 6);
    }

    /** Jaga bidikan supaya lingkaran nggak nembus dinding kiri/kanan. */
    function clampAim(x: number, level: number) {
      const r = LEVELS[level].radius;
      const min = t + r;
      const max = WORLD.width - t - r;
      return Math.max(min, Math.min(max, x));
    }

    // --- Input mouse ------------------------------------------------------
    function screenToWorldX(clientX: number) {
      const rect = canvas!.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * WORLD.width;
    }

    function handleMove(e: MouseEvent) {
      aimX = screenToWorldX(e.clientX);
    }

    function handleDown(e: MouseEvent) {
      if (!canDrop || gameOver) return;
      const x = clampAim(screenToWorldX(e.clientX), currentLevel);
      spawnMicrobe(x, heldY(currentLevel), currentLevel);

      // Geser antrian: next jadi current, lalu bikin next baru.
      currentLevel = nextLevel;
      nextLevel = randomDropLevel();
      onQueueChange?.(currentLevel, nextLevel);

      // Mulai cooldown.
      canDrop = false;
      lastDropAt = performance.now();
    }

    // Sentuh (mobile): gerakkan bidikan lalu jatuhkan saat diangkat.
    function handleTouchMove(e: TouchEvent) {
      if (e.touches[0]) aimX = screenToWorldX(e.touches[0].clientX);
    }
    function handleTouchEnd() {
      if (!canDrop || gameOver) return;
      const x = clampAim(aimX, currentLevel);
      spawnMicrobe(x, heldY(currentLevel), currentLevel);
      currentLevel = nextLevel;
      nextLevel = randomDropLevel();
      onQueueChange?.(currentLevel, nextLevel);
      canDrop = false;
      lastDropAt = performance.now();
    }

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    // --- Deteksi tabrakan -> antre merge ----------------------------------
    function handleCollision(e: Matter.IEventCollision<Matter.Engine>) {
      for (const pair of e.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        if (a.label !== "microbe" || b.label !== "microbe") continue;

        const pa = a.plugin as MicrobePlugin;
        const pb = b.plugin as MicrobePlugin;

        // Syarat merge:
        // - level sama
        // - belum level maksimal
        // - dua-duanya belum "dipesan" untuk merge lain di tick ini
        if (
          pa.level === pb.level &&
          pa.level < MAX_LEVEL &&
          !pa.merged &&
          !pb.merged
        ) {
          pa.merged = true;
          pb.merged = true;
          mergeQueue.push([a, b]);
        }
      }
    }
    Matter.Events.on(engine, "collisionStart", handleCollision);

    /** Proses semua merge yang antre. Dipanggil sekali per frame, SETELAH update. */
    function processMerges() {
      if (mergeQueue.length === 0) return;
      for (const [a, b] of mergeQueue) {
        const level = (a.plugin as MicrobePlugin).level;
        const newLevel = level + 1;

        // Titik lahir mikroba baru = tengah-tengah dua yang lebur.
        const x = (a.position.x + b.position.x) / 2;
        const y = (a.position.y + b.position.y) / 2;

        Matter.Composite.remove(world, a);
        Matter.Composite.remove(world, b);
        spawnMicrobe(x, y, newLevel);

        score += LEVELS[newLevel].score;
      }
      mergeQueue.length = 0; // kosongkan antrian
      onScoreChange?.(score);
    }

    /** Cek apakah ada mikroba diam yang nangkring di atas garis batas kelamaan. */
    function checkGameOver() {
      const now = performance.now();
      for (const body of Matter.Composite.allBodies(world)) {
        if (body.label !== "microbe") continue;
        const p = body.plugin as MicrobePlugin;
        const radius = LEVELS[p.level].radius;
        const top = body.position.y - radius; // sisi atas bola
        const speed = Math.hypot(body.velocity.x, body.velocity.y);

        if (top < GAME_OVER_LINE_Y && speed < SETTLE_SPEED) {
          // Bola diam & menonjol di atas garis: mulai/hitung timer-nya.
          if (p.aboveSince == null) p.aboveSince = now;
          else if (now - p.aboveSince > GAME_OVER_GRACE_MS) {
            gameOver = true;
            clearState(); // hapus snapshot -> refresh setelah kalah mulai fresh
            onGameOver?.(score);
            return;
          }
        } else {
          // Turun lagi atau masih bergerak: reset timer.
          p.aboveSince = undefined;
        }
      }
    }

    // --- Game loop --------------------------------------------------------
    let rafId = 0;

    function drawCircle(x: number, y: number, level: number, ghost = false) {
      const c = ctx!;
      const spec = LEVELS[level];
      c.globalAlpha = ghost ? 0.45 : 1;
      c.beginPath();
      c.arc(x, y, spec.radius, 0, Math.PI * 2);
      c.fillStyle = spec.color;
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = "rgba(0,0,0,0.15)";
      c.stroke();
      c.globalAlpha = 1;
    }

    function draw() {
      const c = ctx!;

      // Saat game over, physics dibekukan (tampilan terakhir tetap terlihat).
      if (!gameOver) {
        Matter.Engine.update(engine, 1000 / 60);
        processMerges(); // proses merge SETELAH physics selesai dihitung
        checkGameOver();

        // Lepaskan cooldown kalau sudah lewat jedanya.
        if (!canDrop && performance.now() - lastDropAt >= DROP_COOLDOWN_MS) {
          canDrop = true;
        }
      }

      c.clearRect(0, 0, WORLD.width, WORLD.height);
      // Zona drop (headroom) dibiarkan transparan -> tembus ke background halaman.
      // Hanya area wadah (di bawah headroom) yang diberi warna.
      c.fillStyle = "#eef9d9";
      c.fillRect(0, HEADROOM, WORLD.width, WORLD.height - HEADROOM);

      // Lantai melengkung digambar mulus mengikuti kurva mangkuk.
      bowl.drawFloor(c);

      // Dinding kiri & kanan.
      c.fillStyle = "#9fc6a0";
      for (const body of [leftWall, rightWall]) {
        c.beginPath();
        const [first, ...rest] = body.vertices;
        c.moveTo(first.x, first.y);
        for (const v of rest) c.lineTo(v.x, v.y);
        c.closePath();
        c.fill();
      }

      // Garis batas (danger line).
      c.save();
      c.setLineDash([8, 6]);
      c.lineWidth = 2;
      c.strokeStyle = "rgba(220,60,80,0.6)";
      c.beginPath();
      c.moveTo(t, GAME_OVER_LINE_Y);
      c.lineTo(WORLD.width - t, GAME_OVER_LINE_Y);
      c.stroke();
      c.restore();

      // Semua mikroba yang sudah jatuh.
      for (const body of Matter.Composite.allBodies(world)) {
        if (body.isStatic) continue;
        const level = (body.plugin as { level?: number })?.level ?? 0;
        drawCircle(body.position.x, body.position.y, level);
      }

      // Preview bidikan hanya ditampilkan saat game masih berjalan.
      if (!gameOver) {
        const previewX = clampAim(aimX, currentLevel);
        drawCircle(previewX, heldY(currentLevel), currentLevel, true);
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    // --- Cleanup ----------------------------------------------------------
    return () => {
      persist(); // simpan progres terakhir saat komponen dilepas (mis. pindah halaman)
      window.clearInterval(saveTimer);
      window.removeEventListener("pagehide", persist);
      cancelAnimationFrame(rafId);
      Matter.Events.off(engine, "collisionStart", handleCollision);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, [onQueueChange, onScoreChange]);

  return (
    <canvas
      ref={canvasRef}
      width={WORLD.width}
      height={WORLD.height}
      className="rounded-2xl cursor-pointer touch-none"
    />
  );
}
