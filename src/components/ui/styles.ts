// Shared control styling. Touch targets are 44px tall on mobile and shrink to
// the denser 36px from `sm` up; 16px text keeps iOS Safari from zooming on focus.
// Surfaces are translucent so the sky behind the cards shows through.

export const INPUT_CLASS =
  "h-11 sm:h-9 text-base sm:text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-900/70 dark:focus:ring-white/70 transition-shadow";

export const PRIMARY_BUTTON_CLASS =
  "h-11 sm:h-9 px-4 text-sm font-semibold rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0";

export const HINT_CLASS = "text-xs text-zinc-500 dark:text-white/50";

export const TITLE_CLASS = "font-serif text-3xl leading-none text-zinc-900 dark:text-white";

export const SUBTITLE_CLASS =
  "font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-white/50";
