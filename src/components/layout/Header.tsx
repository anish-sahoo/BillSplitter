import { Link } from "react-router-dom";

const HEADER_BUTTON = "text-xs font-medium transition-colors px-1 py-2";

export function Header({
  dark,
  onToggleDark,
  crumb,
  onDelete,
  onShare,
  shareLabel = "Share",
}: {
  dark: boolean;
  onToggleDark: () => void;
  /** Current page after "Bills" in the breadcrumb; omitted on the bills page itself */
  crumb?: string;
  onDelete?: () => void;
  onShare?: () => void;
  shareLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
        {crumb === undefined ? (
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            Bill Splitter
          </span>
        ) : (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-base">
            <Link
              to="/"
              className="font-semibold tracking-tight text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors flex-shrink-0"
            >
              Bills
            </Link>
            <span className="text-zinc-300 dark:text-zinc-600 flex-shrink-0">/</span>
            <span
              aria-current="page"
              className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate"
            >
              {crumb}
            </span>
          </nav>
        )}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          {onDelete && (
            <button
              onClick={onDelete}
              className={`${HEADER_BUTTON} text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300`}
            >
              Delete
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className={`${HEADER_BUTTON} text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300`}
            >
              {shareLabel}
            </button>
          )}
          <button
            onClick={onToggleDark}
            className={`${HEADER_BUTTON} text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200`}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}
