import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SNAPPY, TAP } from "../../constants/motion";
import type { Person } from "../../types";
import { personColor } from "../../utils/color";
import { Section } from "../ui/Section";
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { PersonChip } from "./PersonChip";

export function PeopleSection({
  persons,
  onAdd,
  onRemove,
}: {
  persons: Person[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName("");
  };

  return (
    <Section title="People" subtitle="Add everyone at the table" delay={0.04} lean>
      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* Add person */}
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Name…"
            autoComplete="off"
            className={`flex-1 min-w-0 px-3 ${INPUT_CLASS}`}
          />
          <motion.button
            whileTap={TAP}
            transition={SNAPPY}
            onClick={submit}
            disabled={!name.trim()}
            className={PRIMARY_BUTTON_CLASS}
          >
            Add
          </motion.button>
        </div>

        {/* Person chips (for removal) */}
        {persons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {persons.map((p, i) => (
                <PersonChip
                  key={p.id}
                  person={p}
                  color={personColor(i)}
                  onRemove={() => onRemove(p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Section>
  );
}
