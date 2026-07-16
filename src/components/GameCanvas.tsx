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
  SPRITE_SCALE,
  DEBUG_OUTLINE,
  BUCKET_DRAW,
  ROUND_BLOCKS,
} from "@/lib/game/config";
import { createBowl, bucketCavity } from "@/lib/game/bowl";
import { loadSprites, isReady } from "@/lib/game/sprites";
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

/** Data yang kita titipkan di setiap body blok.
 *  aboveSince = kapan (timestamp) bola ini MULAI diam di atas garis batas. */
type BlockPlugin = { level: number; merged?: boolean; aboveSince?: number };

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

  // --- Callback versi TERBARU disimpan di sini --------------------------
  // Effect utama (yang membangun engine) sengaja tidak memasukkan callback ke
  // dependency-nya: kalau masuk, tiap kali induk re-render engine akan
  // dibongkar-pasang dan permainan ter-reset. Tapi kalau effect langsung
  // menangkap callback dari props, dia akan memegang versi LAMA selamanya
  // (stale closure) — mis. `user` yang belum selesai dimuat saat mount.
  //
  // Ref ini menjembatani keduanya: effect dijalankan sekali, tapi selalu
  // memanggil callback versi terkini. Karena itu halaman pemanggil tidak perlu
  // lagi membuat ref sendiri.
  const cbRef = useRef<Props | null>(null);
  useEffect(() => {
    cbRef.current = { onQueueChange, onScoreChange, onGameOver };
  });

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

    // Muat gambar (blok + bucket). Asinkron — game loop cek kesiapannya.
    const sprites = loadSprites();

    // Rongga dalam bucket = area bermain.
    const cavity = bucketCavity();
    // Lantai melengkung supaya blok menggelinding ke tengah bucket.
    const bowl = createBowl(world);

    // Dinding kiri & kanan menempel pada sisi dalam bucket.
    const wallHeight = cavity.bottom - cavity.top;
    const leftWall = Matter.Bodies.rectangle(
      cavity.left - t / 2,
      cavity.top + wallHeight / 2,
      t,
      wallHeight,
      wallOptions,
    );
    const rightWall = Matter.Bodies.rectangle(
      cavity.right + t / 2,
      cavity.top + wallHeight / 2,
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

    function spawnBlock(x: number, y: number, level: number) {
      const spec = LEVELS[level];
      const body = Matter.Bodies.circle(x, y, spec.radius, {
        restitution: 0.2,
        friction: 0.4,
        density: 0.001,
        label: "block",
      });
      const plugin: BlockPlugin = { level };
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
        const body = spawnBlock(sb.x, sb.y, sb.level);
        // Kembalikan juga kecepatan & rotasinya, biar physics-nya mulus
        // (nggak "loncat" seolah semua baru dijatuhkan).
        Matter.Body.setVelocity(body, { x: sb.vx, y: sb.vy });
        Matter.Body.setAngle(body, sb.angle);
        Matter.Body.setAngularVelocity(body, sb.av);
      }
    }

    // Kabari React soal antrian & skor awal (setelah kemungkinan dipulihkan).
    cbRef.current?.onQueueChange?.(currentLevel, nextLevel);
    cbRef.current?.onScoreChange?.(score);

    // --- Simpan snapshot secara berkala & saat halaman ditutup ------------
    function snapshot() {
      const bodies: SavedBody[] = [];
      for (const b of Matter.Composite.allBodies(world)) {
        if (b.label !== "block") continue;
        const p = b.plugin as BlockPlugin;
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

    /** Jaga bidikan supaya blok nggak nembus sisi dalam bucket. */
    function clampAim(x: number, level: number) {
      const r = LEVELS[level].radius;
      const min = cavity.left + r;
      const max = cavity.right - r;
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
      spawnBlock(x, heldY(currentLevel), currentLevel);

      // Geser antrian: next jadi current, lalu bikin next baru.
      currentLevel = nextLevel;
      nextLevel = randomDropLevel();
      cbRef.current?.onQueueChange?.(currentLevel, nextLevel);

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
      spawnBlock(x, heldY(currentLevel), currentLevel);
      currentLevel = nextLevel;
      nextLevel = randomDropLevel();
      cbRef.current?.onQueueChange?.(currentLevel, nextLevel);
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
        if (a.label !== "block" || b.label !== "block") continue;

        const pa = a.plugin as BlockPlugin;
        const pb = b.plugin as BlockPlugin;

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
        const level = (a.plugin as BlockPlugin).level;
        const newLevel = level + 1;

        // Titik lahir blok baru = tengah-tengah dua yang lebur.
        const x = (a.position.x + b.position.x) / 2;
        const y = (a.position.y + b.position.y) / 2;

        Matter.Composite.remove(world, a);
        Matter.Composite.remove(world, b);
        spawnBlock(x, y, newLevel);

        score += LEVELS[newLevel].score;
      }
      mergeQueue.length = 0; // kosongkan antrian
      cbRef.current?.onScoreChange?.(score);
    }

    /** Cek apakah ada blok diam yang nangkring di atas garis batas kelamaan. */
    function checkGameOver() {
      const now = performance.now();
      for (const body of Matter.Composite.allBodies(world)) {
        if (body.label !== "block") continue;
        const p = body.plugin as BlockPlugin;
        const radius = LEVELS[p.level].radius;
        const top = body.position.y - radius; // sisi atas bola
        const speed = Math.hypot(body.velocity.x, body.velocity.y);

        if (top < GAME_OVER_LINE_Y && speed < SETTLE_SPEED) {
          // Bola diam & menonjol di atas garis: mulai/hitung timer-nya.
          if (p.aboveSince == null) p.aboveSince = now;
          else if (now - p.aboveSince > GAME_OVER_GRACE_MS) {
            gameOver = true;
            clearState(); // hapus snapshot -> refresh setelah kalah mulai fresh
            cbRef.current?.onGameOver?.(score);
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

    /** Gambar satu blok Minecraft. `angle` bikin blok terlihat menggelinding. */
    function drawBlock(
      x: number,
      y: number,
      level: number,
      angle = 0,
      ghost = false,
    ) {
      const c = ctx!;
      const spec = LEVELS[level];
      const img = sprites.blocks[level];
      const size = spec.radius * 2 * SPRITE_SCALE;

      c.save();
      c.globalAlpha = ghost ? 0.5 : 1;
      c.translate(x, y);
      c.rotate(angle);

      // ROUND_BLOCKS = true -> tekstur dipotong lingkaran seukuran body physics.
      if (ROUND_BLOCKS) {
        c.beginPath();
        c.arc(0, 0, spec.radius, 0, Math.PI * 2);
        c.clip();
      }

      if (isReady(img)) {
        c.drawImage(img, -size / 2, -size / 2, size, size);
      } else {
        // Cadangan selagi gambar belum selesai dimuat.
        c.fillStyle = spec.color;
        c.fillRect(-size / 2, -size / 2, size, size);
      }

      // Garis tepi tipis biar batas antar blok tetap kelihatan.
      // Digambar SEBELUM restore supaya ikut berputar bersama blok kotak.
      c.lineWidth = 2;
      c.strokeStyle = "rgba(0,0,0,0.35)";
      if (ROUND_BLOCKS) {
        c.beginPath();
        c.arc(0, 0, spec.radius, 0, Math.PI * 2);
        c.stroke();
      } else {
        c.strokeRect(-size / 2, -size / 2, size, size);
      }

      c.restore();
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
      // Pixel-art harus tajam, bukan blur, saat diperbesar.
      c.imageSmoothingEnabled = false;

      // Bucket sebagai wadah. Area gambarnya diatur lewat BUCKET_DRAW di config,
      // terpisah dari ukuran canvas — jadi bucket bisa ditinggikan/diramping-kan
      // tanpa mengubah WORLD.width/height.
      const bx = BUCKET_DRAW.left * WORLD.width;
      const by = BUCKET_DRAW.top * WORLD.height;
      const bw = (BUCKET_DRAW.right - BUCKET_DRAW.left) * WORLD.width;
      const bh = (BUCKET_DRAW.bottom - BUCKET_DRAW.top) * WORLD.height;
      if (isReady(sprites.bucket)) {
        c.drawImage(sprites.bucket, bx, by, bw, bh);
      }

      // Garis batas (danger line) — selebar rongga bucket.
      c.save();
      c.setLineDash([8, 6]);
      c.lineWidth = 2;
      c.strokeStyle = "rgba(220,60,80,0.75)";
      c.beginPath();
      c.moveTo(cavity.left, GAME_OVER_LINE_Y);
      c.lineTo(cavity.right, GAME_OVER_LINE_Y);
      c.stroke();
      c.restore();

      // Semua blok yang sudah jatuh (ikut berputar sesuai physics).
      for (const body of Matter.Composite.allBodies(world)) {
        if (body.isStatic) continue;
        const level = (body.plugin as { level?: number })?.level ?? 0;
        drawBlock(body.position.x, body.position.y, level, body.angle);
      }

      // Preview bidikan hanya ditampilkan saat game masih berjalan.
      if (!gameOver) {
        const previewX = clampAim(aimX, currentLevel);
        drawBlock(previewX, heldY(currentLevel), currentLevel, 0, true);
      }

      // --- Garis bantu kalibrasi (matikan lewat DEBUG_OUTLINE di config) ---
      if (DEBUG_OUTLINE) {
        c.save();
        c.setLineDash([]);

        // MAGENTA: batas canvas -> setel WORLD.width / WORLD.height
        c.strokeStyle = "#ff00ff";
        c.lineWidth = 2;
        c.strokeRect(1, 1, WORLD.width - 2, WORLD.height - 2);

        // ORANYE: area GAMBAR bucket -> setel BUCKET_DRAW
        c.strokeStyle = "#ff9500";
        c.strokeRect(bx, by, bw, bh);

        // CYAN: rongga bucket (area bermain) -> setel BUCKET.innerLeft/Right/Bottom
        c.strokeStyle = "#00ffff";
        c.strokeRect(
          cavity.left,
          cavity.top,
          cavity.right - cavity.left,
          cavity.bottom - cavity.top,
        );

        // KUNING: lantai melengkung sesungguhnya -> setel BOWL.depth
        c.strokeStyle = "#ffee00";
        c.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = cavity.left + ((cavity.right - cavity.left) * i) / 40;
          const y = bowl.curveYAt(x);
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();

        // Angka-angka biar gampang dibaca sambil nyetel.
        c.font = "bold 12px monospace";
        c.fillStyle = "#ff00ff";
        c.fillText(`canvas ${WORLD.width} x ${WORLD.height}`, 6, 14);
        c.fillStyle = "#00b8b8";
        c.fillText(
          `cavity L:${Math.round(cavity.left)} R:${Math.round(cavity.right)} B:${Math.round(cavity.bottom)}`,
          6,
          28,
        );
        c.restore();
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
    // Sengaja tanpa dependency: engine dibangun SEKALI saja. Callback terbaru
    // sudah dijamin lewat cbRef di atas.
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={WORLD.width}
      height={WORLD.height}
      // w-full + h-auto: canvas menyusut mengikuti lebar induknya (mobile),
      // tapi resolusi internalnya tetap WORLD.width x WORLD.height — jadi
      // physics tidak terpengaruh. Bidikan tetap akurat karena screenToWorldX
      // menghitung posisi relatif terhadap ukuran tampil (getBoundingClientRect).
      className="block h-auto w-full cursor-pointer touch-none select-none"
    />
  );
}
