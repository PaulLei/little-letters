const OPTIONS = [
  { id: "cream", name: "Cream", swatch: "border-hairline bg-[#FFFDF7]" },
  { id: "sage", name: "Sage tint", swatch: "border-sage/70 bg-[#F8FAF3]" },
  { id: "blush", name: "Blush border", swatch: "border-blush bg-[#FFF8F8]" },
  { id: "butter", name: "Butter glow", swatch: "border-butter bg-[#FFFBEF]" },
];
export default function StationeryPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 font-ui text-[11px] uppercase tracking-[.14em] text-ink-soft">
        Stationery
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-2 font-ui text-[11px] ${value === option.id ? "border-ink/40 bg-muted" : "border-hairline bg-background text-ink-soft"}`}
          >
            <span
              aria-hidden="true"
              className={`h-6 w-6 shrink-0 rounded-[3px] border ${option.swatch}`}
            />
            {option.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
