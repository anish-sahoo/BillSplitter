import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { BOUNCY } from "../../constants/motion";
import { useTheme } from "../../hooks/useTheme";
import { LEAN_OK, restingTilt } from "../../utils/crisp";

// Deterministic "random" tilt per card so the layout looks hand-placed but
// doesn't jump around on every render.
function tiltFor(seed: string): number {
  let hash = 0;

  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;

  return ((Math.abs(hash) % 300) - 150) / 100; // −1.5° … +1.5°
}

// Frosted glass card that pops in with a spring, sits at a slight tilt, and
// straightens when hovered. With `lean`, it also tips toward the cursor.
// The flat theme swaps all of that for a plain solid card.
export function Card({
  seed,
  delay = 0,
  lean = false,
  className = "",
  children,
}: {
  /** Stable key for the tilt, e.g. the section name */
  seed: string;
  delay?: number;
  lean?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { dark, flat } = useTheme();
  const tilt = flat ? 0 : tiltFor(seed);
  const rotateX = useSpring(useMotionValue(0), BOUNCY);
  const rotateY = useSpring(useMotionValue(0), BOUNCY);
  const leans = lean && !flat && LEAN_OK;

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!leans || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 6);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 6);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const surface = flat
    ? "rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
    : `rounded-[28px] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] ${
        dark ? "border-white/10 bg-[#0a0f2a]/55" : "border-white/60 bg-white/65"
      }`;

  return (
    // Perspective lives on the wrapper so a resting card has no transform at
    // all; a lingering 3D transform would keep its text blurry on 1x screens.
    <div style={leans ? { perspective: 900 } : undefined}>
      <motion.div
        initial={
          flat ? { opacity: 0, y: 12 } : { opacity: 0, y: 40, scale: 0.92, rotate: tilt * 3 }
        }
        animate={{ opacity: 1, y: 0, scale: 1, rotate: restingTilt(tilt) }}
        whileHover={flat ? undefined : { rotate: 0, scale: 1.01, y: -3 }}
        transition={{ ...BOUNCY, delay }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={leans ? { rotateX, rotateY } : undefined}
        className={`relative border ${surface} ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
