// Rotated text rasterises soft on 1x screens (e.g. a 1080p monitor), so the
// resting tilt is only used on high-density displays where it stays sharp.
export const TILT_OK = typeof window !== "undefined" && window.devicePixelRatio >= 2;

export function restingTilt(degrees: number): number {
  return TILT_OK ? degrees : 0;
}
