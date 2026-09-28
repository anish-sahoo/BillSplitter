import { LayoutGroup } from "framer-motion";
import type { BillStore } from "../../hooks/useBillStore";
import { personColor } from "../../utils/color";
import { Section } from "../ui/Section";
import { PersonCard } from "./PersonCard";

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

export function BreakdownSection({ store, delay }: { store: BillStore; delay?: number }) {
  const { totals } = store;

  return (
    <Section title="Breakdown" subtitle="Tap someone to see their items" delay={delay} lean>
      <LayoutGroup>
        <div className="px-4 pb-5 flex flex-wrap gap-2.5">
          {store.bill.persons.map((person, i) => (
            <PersonCard
              key={person.id}
              person={person}
              color={personColor(i)}
              share={totals.shares.get(person.id)}
              paidCents={totals.paidCents.get(person.id) ?? 0}
              tilt={TILTS[i % TILTS.length]}
            />
          ))}
        </div>
      </LayoutGroup>
    </Section>
  );
}
