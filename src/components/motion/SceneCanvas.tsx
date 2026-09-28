import { useEffect, useRef } from "react";
import { useTheme } from "../../hooks/useTheme";

// Hand-drawn (well, code-drawn) landscape behind the app. Dawn is a bright
// meadow under cumulus clouds; dusk is blue hour with stars, a crescent moon,
// grass silhouettes and city lights. Switching themes blends one into the
// other over about a second, like the sun going down.

type RGB = [number, number, number];

function hex(h: string): RGB {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgba(c: RGB, alpha = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
}

// Small seeded PRNG so the scene is the same on every load
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = {
  dawn: {
    sky: ["#2a64ad", "#4f8ed3", "#9cc7ec", "#e4eef4"].map(hex),
    hillFar: hex("#9bb8cc"),
    hillNear: hex("#7fa591"),
    ground: hex("#4f8540"),
    grass: ["#86b36a", "#5e9446", "#3f7431"].map(hex),
    seed: hex("#e9dfb0"),
  },
  dusk: {
    sky: ["#060b22", "#15225a", "#5b4b8a", "#e67a68"].map(hex),
    hillFar: hex("#2a1f45"),
    hillNear: hex("#161129"),
    ground: hex("#0b0a19"),
    grass: ["#1a1733", "#100e24", "#070612"].map(hex),
    seed: hex("#0d0b1e"),
  },
};

const FLOWER_COLORS = ["#f7b3c7", "#ffffff", "#f9d86b", "#f4a3b5", "#e9c6f2"].map(hex);

interface Blade {
  x: number;
  h: number;
  /** Base width in px; blades taper to a point */
  width: number;
  phase: number;
  lean: number;
  /** How much the blade droops toward its tip */
  bend: number;
  /** 0 = sunlit, 1 = base colour, 2 = shaded */
  shade: 0 | 1 | 2;
  seed: boolean;
}

interface Scene {
  w: number;
  h: number;
  horizon: number;
  layers: { baseY: number; maxH: number; blades: Blade[] }[];
  flowers: { x: number; layer: number; blade: number; color: RGB; size: number }[];
  stars: { x: number; y: number; r: number; phase: number }[];
  lights: { x: number; y: number; r: number; phase: number; warm: boolean }[];
  fireflies: { x: number; y: number; phase: number; speed: number }[];
  hillFar: number[];
  hillNear: number[];
  clouds: { sprite: HTMLCanvasElement; x: number; y: number; speed: number }[];
  wisps: { x: number; y: number; w: number; h: number; speed: number }[];
  moon: HTMLCanvasElement;
}

// Cumulus cloud: a pile of soft puffs, bright on top and shaded underneath
function cloudSprite(rand: () => number, size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size * 2.4;
  canvas.height = size * 1.3;
  const ctx = canvas.getContext("2d")!;
  const puffs = 22 + Math.floor(rand() * 12);
  const base = canvas.height * 0.8;

  for (let i = 0; i < puffs; i++) {
    const t = i / puffs;
    // Taller in the middle, flat along the bottom
    const cx = canvas.width * (0.16 + t * 0.68) + (rand() - 0.5) * size * 0.25;
    const r = size * (0.16 + Math.sin(t * Math.PI) * 0.26 + rand() * 0.12);
    const cy = base - r * (0.45 + rand() * 0.45);
    const g = ctx.createRadialGradient(cx, cy - r * 0.25, r * 0.05, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(255,255,255,0.75)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // One smooth shade over the whole cloud: sunlit top, cool grey belly
  ctx.globalCompositeOperation = "source-atop";
  const shade = ctx.createLinearGradient(0, base - size * 0.9, 0, base);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(0.55, "rgba(200,214,232,0.35)");
  shade.addColorStop(1, "rgba(150,172,205,0.75)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

function moonSprite(): HTMLCanvasElement {
  const size = 120;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const glow = ctx.createRadialGradient(c, c, 4, c, c, c);
  glow.addColorStop(0, "rgba(255,240,210,0.35)");
  glow.addColorStop(1, "rgba(255,240,210,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const disc = document.createElement("canvas");
  disc.width = disc.height = size;
  const d = disc.getContext("2d")!;
  d.fillStyle = "#fff6dc";
  d.beginPath();
  d.arc(c, c, 11, 0, Math.PI * 2);
  d.fill();
  d.globalCompositeOperation = "destination-out";
  d.beginPath();
  d.arc(c + 5, c - 3, 10, 0, Math.PI * 2);
  d.fill();
  ctx.drawImage(disc, 0, 0);

  return canvas;
}

function hillLine(rand: () => number, w: number, points: number): number[] {
  const a = rand() * 10;
  const b = rand() * 10;

  return Array.from({ length: points + 1 }, (_, i) => {
    const x = (i / points) * w;

    return (
      Math.sin(x * 0.0021 + a) * 0.5 + Math.sin(x * 0.0057 + b) * 0.3 + Math.sin(x * 0.013) * 0.2
    );
  });
}

function buildScene(w: number, h: number): Scene {
  const rand = prng(7);
  const horizon = h * 0.64;
  const scale = Math.min(1.4, Math.max(0.7, h / 900));
  const ground = h - horizon;

  // Grass grows in clumps: a few blades fanning out from one spot, the
  // middle ones tallest. Far layers are denser, shorter and thinner.
  const layerSpecs = [
    { baseY: horizon + ground * 0.26, spacing: 7, per: [4, 7], min: 10, max: 30, width: 1.8 },
    { baseY: horizon + ground * 0.6, spacing: 12, per: [4, 8], min: 26, max: 72, width: 3 },
    { baseY: h + 8, spacing: 20, per: [3, 7], min: 70, max: 220, width: 5 },
  ];

  const layers = layerSpecs.map((spec, li) => {
    const blades: Blade[] = [];
    const clumps = Math.ceil(w / spec.spacing);

    for (let c = 0; c < clumps; c++) {
      const cx = (c + rand()) * spec.spacing;
      const count = spec.per[0] + Math.floor(rand() * (spec.per[1] - spec.per[0] + 1));
      const clumpH = spec.min + rand() * (spec.max - spec.min);
      const spread = spec.spacing * 0.6;

      for (let b = 0; b < count; b++) {
        const offset = (rand() - 0.5) * 2; // −1 … 1 across the clump
        const centre = 1 - Math.abs(offset) * 0.45;
        const r = rand();
        blades.push({
          x: cx + offset * spread,
          h: clumpH * centre * (0.7 + rand() * 0.45) * scale,
          width: spec.width * (0.6 + rand() * 0.7),
          phase: rand() * Math.PI * 2,
          // Outer blades fan away from the clump centre
          lean: offset * 0.45 + (rand() - 0.5) * 0.2,
          bend: 0.15 + rand() * 0.5,
          shade: r < 0.3 ? 0 : r < 0.75 ? 1 : 2,
          seed: li === 2 && rand() < 0.1,
        });
      }
    }

    return { baseY: spec.baseY, maxH: spec.max * scale, blades };
  });

  const flowers = Array.from({ length: Math.ceil(w / 14) }, () => {
    const layer = rand() < 0.65 ? 1 : 2;

    return {
      x: 0,
      layer,
      blade: Math.floor(rand() * layers[layer].blades.length),
      color: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)],
      size: (layer === 2 ? 4 + rand() * 4 : 2 + rand() * 2) * scale,
    };
  });

  const stars = Array.from({ length: Math.ceil((w * horizon) / 5000) }, () => ({
    x: rand() * w,
    y: Math.pow(rand(), 1.6) * horizon * 0.9,
    r: 0.4 + rand() * 1.1,
    phase: rand() * Math.PI * 2,
  }));

  const lights = Array.from({ length: Math.ceil(w / 5) }, () => ({
    x: rand() * w,
    y: horizon - 4 + Math.pow(rand(), 2) * ground * 0.3,
    r: 0.5 + rand() * 1.3,
    phase: rand() * Math.PI * 2,
    warm: rand() < 0.8,
  }));

  const fireflies = Array.from({ length: 26 }, () => ({
    x: rand() * w,
    y: horizon + rand() * ground * 0.9,
    phase: rand() * Math.PI * 2,
    speed: 0.3 + rand() * 0.7,
  }));

  const clouds = Array.from({ length: 6 }, (_, i) => ({
    sprite: cloudSprite(rand, (110 + rand() * 120) * scale),
    x: (i / 6) * w * 1.3 + rand() * 120,
    y: horizon * (0.08 + rand() * 0.5),
    speed: 4 + rand() * 6,
  }));

  const wisps = Array.from({ length: 9 }, () => ({
    x: rand() * w,
    y: horizon * (0.45 + rand() * 0.45),
    w: (160 + rand() * 360) * scale,
    h: (4 + rand() * 9) * scale,
    speed: 2 + rand() * 4,
  }));

  return {
    w,
    h,
    horizon,
    layers,
    flowers,
    stars,
    lights,
    fireflies,
    hillFar: hillLine(rand, w, 80),
    hillNear: hillLine(rand, w, 80),
    clouds,
    wisps,
    moon: moonSprite(),
  };
}

function waveAt(sec: number, x: number): number {
  return Math.sin(sec * 0.9 - x * 0.0025) * 0.5 + Math.sin(sec * 0.37 - x * 0.001) * 0.5;
}

function drawHill(
  ctx: CanvasRenderingContext2D,
  s: Scene,
  line: number[],
  baseY: number,
  amp: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s.h);
  line.forEach((v, i) => ctx.lineTo((i / (line.length - 1)) * s.w, baseY - (v + 1) * amp));
  ctx.lineTo(s.w, s.h);
  ctx.closePath();
  ctx.fill();
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: Scene,
  t: number,
  m: number,
  scroll: number,
  pointer: { x: number; y: number },
) {
  const P = PALETTES;
  const { w, h, horizon } = s;
  const sec = t / 1000;
  const px = (depth: number) => pointer.x * depth;
  // Scrolling tips the camera up: the ground sinks away faster than the sky
  const sink = (depth: number) => Math.min(scroll, h) * depth;

  // Sky
  const sky = ctx.createLinearGradient(0, sink(0.05), 0, horizon + sink(0.2));
  const stops = [0, 0.45, 0.82, 1];
  stops.forEach((stop, i) => sky.addColorStop(stop, rgba(mix(P.dawn.sky[i], P.dusk.sky[i], m))));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Morning sun haze / evening horizon glow
  if (m < 1) {
    const sun = ctx.createRadialGradient(w * 0.82, h * 0.1, 0, w * 0.82, h * 0.1, w * 0.5);
    sun.addColorStop(0, `rgba(255,255,245,${0.45 * (1 - m)})`);
    sun.addColorStop(1, "rgba(255,255,245,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
  }

  if (m > 0) {
    const glowY = horizon + sink(0.2);
    const glow = ctx.createRadialGradient(w * 0.5, glowY, 0, w * 0.5, glowY, w * 0.6);
    glow.addColorStop(0, `rgba(255,140,110,${0.45 * m})`);
    glow.addColorStop(1, "rgba(255,140,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Stars and moon
    for (const star of s.stars) {
      const twinkle = 0.55 + 0.45 * Math.sin(sec * 1.7 + star.phase);
      ctx.fillStyle = `rgba(255,250,235,${m * twinkle * (1 - star.y / horizon) * 0.95})`;
      ctx.beginPath();
      ctx.arc(star.x + px(2), star.y + sink(0.03), star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = m;
    ctx.drawImage(s.moon, w * 0.8 - 60 + px(4), h * 0.13 - 60 + sink(0.04));
    ctx.globalAlpha = 1;

    // Thin clouds lit pink from below
    for (const wisp of s.wisps) {
      const x = ((wisp.x + sec * wisp.speed) % (w + wisp.w)) - wisp.w + px(6);
      const y = wisp.y + sink(0.08);
      const g = ctx.createLinearGradient(0, y - wisp.h, 0, y + wisp.h);
      g.addColorStop(0, `rgba(40,38,90,${0.55 * m})`);
      g.addColorStop(1, `rgba(245,150,140,${0.55 * m})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + wisp.w / 2, y, wisp.w / 2, wisp.h, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cumulus clouds
  if (m < 1) {
    ctx.globalAlpha = 1 - m;

    for (const cloud of s.clouds) {
      const cw = cloud.sprite.width;
      const x = ((cloud.x + sec * cloud.speed) % (w + cw)) - cw + px(8);
      ctx.drawImage(cloud.sprite, x, cloud.y + sink(0.1));
    }

    ctx.globalAlpha = 1;
  }

  // Hills
  drawHill(
    ctx,
    s,
    s.hillFar,
    horizon + 6 + sink(0.22),
    h * 0.05,
    rgba(mix(P.dawn.hillFar, P.dusk.hillFar, m)),
  );

  // City lights sit on the far hills at dusk
  if (m > 0) {
    for (const light of s.lights) {
      const flicker = 0.6 + 0.4 * Math.sin(sec * 2.3 + light.phase);
      ctx.fillStyle = light.warm
        ? `rgba(255,205,140,${m * flicker})`
        : `rgba(170,210,255,${m * flicker})`;
      ctx.beginPath();
      ctx.arc(light.x + px(10), light.y + sink(0.25), light.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHill(
    ctx,
    s,
    s.hillNear,
    horizon + h * 0.06 + sink(0.28),
    h * 0.035,
    rgba(mix(P.dawn.hillNear, P.dusk.hillNear, m)),
  );

  const groundTop = horizon + h * 0.07 + sink(0.3);
  const groundColor = mix(P.dawn.ground, P.dusk.ground, m);
  const hillColor = mix(P.dawn.hillNear, P.dusk.hillNear, m);
  const groundFill = ctx.createLinearGradient(0, groundTop - 10, 0, groundTop + h * 0.08);
  groundFill.addColorStop(0, rgba(hillColor));
  groundFill.addColorStop(1, rgba(groundColor));
  ctx.fillStyle = groundFill;
  ctx.fillRect(0, groundTop - 10, w, h - groundTop + 410);

  // Grass, back to front. Each blade sways on its own, and a slow gust rolls
  // across the meadow as a travelling wave. Taller blades move more.
  const tips: { x: number; y: number }[][] = [];
  s.layers.forEach((layer, li) => {
    const depth = [0.34, 0.5, 0.75][li];
    const baseY = layer.baseY + sink(depth);
    const base = mix(P.dawn.grass[li], P.dusk.grass[li], m);

    const shades = [
      rgba(mix(base, hex("#f4f1c0"), 0.16 * (1 - m))),
      rgba(base),
      rgba(mix(base, hex("#0b1a10"), 0.18)),
    ];

    const paths = [new Path2D(), new Path2D(), new Path2D()];
    const layerTips: { x: number; y: number }[] = [];
    const shift = px([12, 18, 28][li]);

    for (const blade of layer.blades) {
      const x = blade.x + shift;
      const flex = blade.h / layer.maxH;
      const wave = waveAt(sec, blade.x);

      const sway =
        blade.lean + (Math.sin(sec * 1.4 + blade.phase) * 0.06 + wave * 0.22) * (0.4 + flex);

      // Droop: the tip swings out and down more than the middle does
      const tipX = x + sway * blade.h * (0.6 + blade.bend);
      const tipY = baseY - blade.h * (1 - Math.min(0.5, Math.abs(sway) * blade.bend));
      const ctrlX = x + sway * blade.h * 0.15;
      const ctrlY = baseY - blade.h * 0.62;
      const half = blade.width / 2;
      const path = paths[blade.shade];
      path.moveTo(x - half, baseY);
      path.quadraticCurveTo(ctrlX - half * 0.6, ctrlY, tipX, tipY);
      path.quadraticCurveTo(ctrlX + half * 0.6, ctrlY, x + half, baseY);
      path.closePath();
      layerTips.push({ x: tipX, y: tipY });
    }

    paths.forEach((path, i) => {
      ctx.fillStyle = shades[i];
      ctx.fill(path);
    });
    tips.push(layerTips);

    // Fluffy seed heads on some foreground blades
    if (li === 2) {
      ctx.fillStyle = rgba(mix(P.dawn.seed, P.dusk.seed, m), 0.9);
      layer.blades.forEach((blade, bi) => {
        if (!blade.seed) return;
        const tip = layerTips[bi];
        ctx.beginPath();
        ctx.ellipse(
          tip.x,
          tip.y + 10,
          3.2,
          14,
          blade.lean + waveAt(sec, blade.x) * 0.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    }
  });

  // Flowers ride on blade tips; at dusk they fade into the silhouettes
  for (const flower of s.flowers) {
    const tip = tips[flower.layer][flower.blade];

    if (!tip) continue;
    const color = mix(flower.color, P.dusk.grass[flower.layer], m);
    ctx.fillStyle = rgba(color);

    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        tip.x + Math.cos(a) * flower.size * 0.7,
        tip.y + Math.sin(a) * flower.size * 0.7,
        flower.size * 0.6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.fillStyle = rgba(mix(hex("#f6c945"), P.dusk.grass[flower.layer], m));
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, flower.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fireflies drift over the dusk meadow
  if (m > 0) {
    for (const fly of s.fireflies) {
      const x = fly.x + Math.sin(sec * fly.speed + fly.phase) * 40 + px(24);
      const y = fly.y + Math.cos(sec * fly.speed * 0.8 + fly.phase) * 22 + sink(0.6);
      const pulse = 0.4 + 0.6 * Math.max(0, Math.sin(sec * 2 + fly.phase));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
      g.addColorStop(0, `rgba(255,225,140,${m * pulse})`);
      g.addColorStop(1, "rgba(255,225,140,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 10, y - 10, 20, 20);
    }
  }
}

export function SceneCanvas() {
  const dusk = useTheme().dark;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read by the animation loop, which eases the scene toward it
  const target = useRef(dusk ? 1 : 0);

  useEffect(() => {
    target.current = dusk ? 1 : 0;
  }, [dusk]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    let scene: Scene;
    let mixValue = target.current;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = buildScene(w, h);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * -1;
      pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * -1;
    };

    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      // Ease the day/night blend and the pointer parallax toward their targets
      mixValue += (target.current - mixValue) * Math.min(1, dt / (reduceMotion ? 1 : 450));
      pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt / 300);
      pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt / 300);
      draw(
        ctx,
        scene,
        reduceMotion ? 0 : now,
        mixValue,
        reduceMotion ? 0 : window.scrollY,
        reduceMotion ? { x: 0, y: 0 } : pointer,
      );
      frame = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 print:hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Dot-matrix screen texture and a little film grain on top of the painting */}
      <div className="absolute inset-0 scene-dots" />
      <div className="absolute inset-0 scene-grain" />
    </div>
  );
}
