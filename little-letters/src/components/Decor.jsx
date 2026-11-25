export function Flower({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.1">
        <circle cx="12" cy="6.6" r="2.5" />
        <circle cx="7" cy="10.2" r="2.5" />
        <circle cx="17" cy="10.2" r="2.5" />
        <circle cx="8.8" cy="15.4" r="2.5" />
        <circle cx="15.2" cy="15.4" r="2.5" />
      </g>
      <circle cx="12" cy="11" r="1.3" fill="currentColor" />
    </svg>
  );
}
export function Heart({ className = "", filled = true }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 20s-7.2-4.4-7.2-9.2A4 4 0 0 1 12 8.2a4 4 0 0 1 7.2 2.6C19.2 15.6 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Sparkle({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M12 4v5M12 15v5M4 12h5M15 12h5" />
      </g>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
export function EnvelopeDoodle({ className = "" }) {
  return (
    <svg
      viewBox="0 0 80 58"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <rect x="4" y="6" width="72" height="46" rx="5" />
        <path d="M4 12l36 24 36-24" />
        <path d="M4 50l24-19M76 50L52 31" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
}
export function StampMark({ className = "", children }) {
  return (
    <div
      className={`relative grid place-items-center border border-dashed border-ink/25 bg-paper/80 text-ink/45 ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
export function WashiTape({ className = "", tone = "blush" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-5 w-24 -rotate-3 opacity-80 ${{ blush: "washi", sage: "bg-sage/60", butter: "bg-butter/80" }[tone]} ${className}`}
    />
  );
}
