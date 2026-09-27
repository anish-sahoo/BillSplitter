// Shared spring presets. Springs overshoot a little, which is what makes the
// UI feel bouncy rather than eased.
export const SNAPPY = { type: "spring", stiffness: 500, damping: 30 } as const;

export const BOUNCY = { type: "spring", stiffness: 260, damping: 18 } as const;

export const SOFT = { type: "spring", stiffness: 120, damping: 20 } as const;

export const TAP = { scale: 0.94 };
