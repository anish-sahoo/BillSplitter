import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BOUNCY, TAP } from "../../constants/motion";
import type { Person } from "../../types";
import { colorBg } from "../../utils/color";
import { Avatar } from "../ui/Avatar";

// Compact toggle that's just a face, and grows to show the name on hover. A
// tap opens it briefly too, so touch users see who they picked. Used as an
// on/off switch (who shares items) or a radio (who paid).
export function AvatarToggle({
  person,
  color,
  selected,
  onToggle,
  role = "switch",
}: {
  person: Person;
  color: string;
  selected: boolean;
  onToggle: () => void;
  role?: "switch" | "radio";
}) {
  const [expanded, setExpanded] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const flashName = () => {
    setExpanded(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setExpanded(false), 1200);
  };

  return (
    <motion.button
      type="button"
      layout
      role={role}
      aria-checked={selected}
      aria-label={person.name}
      whileTap={TAP}
      transition={BOUNCY}
      onClick={(e) => {
        onToggle();

        // Mouse users already see the name from hovering
        if (e.detail === 0 || !matchMedia("(hover: hover)").matches) flashName();
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setExpanded(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setExpanded(false)}
      className="flex items-center rounded-full border p-0.5 text-sm font-medium transition-colors"
      style={{
        opacity: selected || expanded ? 1 : 0.5,
        backgroundColor: selected ? colorBg(color, 0.16) : "transparent",
        borderColor: selected ? color : "transparent",
        color: selected ? color : undefined,
      }}
    >
      <motion.span layout="position">
        <Avatar
          name={person.name}
          color={selected ? color : colorBg(color, 0.55)}
          className="w-8 h-8 text-xs"
        />
      </motion.span>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={BOUNCY}
            className="overflow-hidden whitespace-nowrap text-zinc-800 dark:text-white/90"
          >
            <span className="block pl-2 pr-2.5">{person.name}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
