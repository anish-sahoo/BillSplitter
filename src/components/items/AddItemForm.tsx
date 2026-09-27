import { motion } from "framer-motion";
import { useState } from "react";
import { SNAPPY, TAP } from "../../constants/motion";
import { sanitizeDecimal } from "../../utils/numeric";
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS } from "../ui/styles";
import { QuantityStepper } from "./QuantityStepper";

export function AddItemForm({
  onAdd,
}: {
  onAdd: (name: string, unitPrice: number, quantity: number) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  const unitPrice = parseFloat(price);
  const canAdd = !!name.trim() && unitPrice > 0;

  const submit = () => {
    if (!canAdd) return;
    onAdd(name.trim(), unitPrice, Math.max(1, parseInt(qty, 10) || 1));
    setName("");
    setPrice("");
    setQty("1");
  };

  return (
    // One row from `sm` up. On phones the name gets its own full-width row,
    // with quantity, price and Add underneath.
    <div className="flex flex-wrap sm:flex-nowrap gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Item name…"
        aria-label="Item name"
        autoComplete="off"
        className={`basis-full sm:basis-auto sm:flex-1 min-w-0 px-3 ${INPUT_CLASS}`}
      />
      <QuantityStepper value={qty} onChange={setQty} onEnter={submit} />
      <div className="relative flex-1 sm:flex-none sm:w-24 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base sm:text-sm pointer-events-none">
          $
        </span>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Unit price"
          autoComplete="off"
          value={price}
          onChange={(e) => setPrice(sanitizeDecimal(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0.00"
          className={`w-full pl-7 pr-3 tabular-nums ${INPUT_CLASS}`}
        />
      </div>
      <motion.button
        whileTap={TAP}
        transition={SNAPPY}
        onClick={submit}
        disabled={!canAdd}
        className={PRIMARY_BUTTON_CLASS}
      >
        Add
      </motion.button>
    </div>
  );
}
