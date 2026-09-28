// Rotated text rasterises soft on 1x screens, and on phones, where glass over
// a live canvas gets composited at low resolution. So the resting tilt is only
// used on high-density screens with a mouse, where it stays sharp.
const HAS_MOUSE =
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const TILT_OK = HAS_MOUSE && window.devicePixelRatio >= 2;

// Cursor lean needs a mouse. Skipping it on touch screens also drops the 3D
// perspective wrapper, which mobile Safari can rasterise at low resolution.
export const LEAN_OK = HAS_MOUSE;

export function restingTilt(degrees: number): number {
  return TILT_OK ? degrees : 0;
}
