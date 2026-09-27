import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { SOFT } from "../../constants/motion";
import { fmt } from "../../utils/format";

// Dollar amount that rolls to its new value instead of snapping.
export function AnimatedDollars({ cents, className = "" }: { cents: number; className?: string }) {
  const value = useSpring(0, SOFT);
  const text = useTransform(value, (v) => `$${fmt(Math.round(v) / 100)}`);

  useEffect(() => {
    value.set(cents);
  }, [cents, value]);

  return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
}
