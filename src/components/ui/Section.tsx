import type { ReactNode } from "react";
import { Card } from "../motion/Card";
import { SUBTITLE_CLASS, TITLE_CLASS } from "./styles";

// Card with a titled header. Children supply their own padding so sections can
// run edge-to-edge content (grids, footers) when they need to.
export function Section({
  title,
  subtitle,
  delay,
  lean,
  children,
}: {
  title: string;
  subtitle?: string;
  delay?: number;
  lean?: boolean;
  children: ReactNode;
}) {
  return (
    <Card seed={title} delay={delay} lean={lean}>
      <div className="px-5 pt-5 pb-3">
        <h2 className={TITLE_CLASS}>{title}</h2>
        {subtitle && <p className={`${SUBTITLE_CLASS} mt-2`}>{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}
