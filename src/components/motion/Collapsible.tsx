import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { BOUNCY, SNAPPY } from "../../constants/motion";

// Header row that toggles a springy reveal of its content. `summary` is what
// shows while closed, e.g. "Tax 6.25% · Tip 0%".
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className = "",
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className={className}>
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.97 }}
        transition={SNAPPY}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={BOUNCY}
          className="w-4 h-4 flex-shrink-0 text-zinc-400 dark:text-white/50"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0, scale: 0.97 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.97 }}
            transition={BOUNCY}
            className="overflow-hidden origin-top"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
