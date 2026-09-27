import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SNAPPY, TAP } from "../../constants/motion";
import { useTheme, type ThemeName } from "../../hooks/useTheme";
import { ThemeMenu } from "./ThemeMenu";

const PILL = "h-9 px-4 rounded-full text-[13px] font-medium transition-colors";

const GLASS_BAR =
  "rounded-full border border-white/60 dark:border-white/10 bg-white/60 dark:bg-[#0a0f2a]/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.35)]";

const FLAT_BAR =
  "rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm";

export function Header({
  onThemeChange,
  crumb,
  onShare,
  shareLabel = "Share",
}: {
  onThemeChange: (theme: ThemeName) => void;
  /** Current bill after the brand in the breadcrumb; omitted on the bills page */
  crumb?: string;
  onShare?: () => void;
  shareLabel?: string;
}) {
  const { flat } = useTheme();

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3">
      <div
        className={`max-w-7xl mx-auto h-14 pl-5 pr-2 flex items-center justify-between gap-3 ${flat ? FLAT_BAR : GLASS_BAR}`}
      >
        <nav aria-label="Breadcrumb" className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/"
            className="font-serif text-[22px] leading-none text-zinc-900 dark:text-white flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            Bill Splitter
          </Link>
          {crumb !== undefined && (
            <>
              {/* Hidden on phones: the hero card right below already shows the name */}
              <span className="hidden sm:inline text-zinc-400 dark:text-white/30 flex-shrink-0">
                /
              </span>
              <span
                aria-current="page"
                className="hidden sm:inline text-sm font-medium text-zinc-600 dark:text-white/70 truncate"
              >
                {crumb}
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onShare && (
            <motion.button
              whileTap={TAP}
              transition={SNAPPY}
              onClick={onShare}
              className={`${PILL} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-white/85`}
            >
              {shareLabel}
            </motion.button>
          )}
          <ThemeMenu onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
