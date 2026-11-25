import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "./Decor";
export default function Envelope({
  label = "Open your mailbox",
  unread = 0,
  onOpen,
  disabled = false,
}) {
  const reduceMotion = useReducedMotion();
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    if (!opening) return;
    const timer = setTimeout(() => {
      onOpen?.();
      setOpening(false);
    }, 780);
    return () => clearTimeout(timer);
  }, [opening, onOpen]);
  return (
    <button
      type="button"
      disabled={disabled || opening}
      onClick={() => {
        if (reduceMotion) onOpen?.();
        else setOpening(true);
      }}
      aria-label={label}
      className={`group relative block w-[min(80vw,320px)] rounded-2xl outline-offset-8 disabled:opacity-100 ${unread > 0 && !opening ? "animate-envelope-wiggle motion-reduce:animate-none" : ""}`}
      style={{ perspective: "900px" }}
    >
      <div className="relative aspect-[3/2] w-full">
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={opening ? { y: -104, opacity: 1 } : { y: 6, opacity: 0 }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
            delay: opening ? 0.18 : 0,
          }}
          className="paper-grain absolute inset-x-5 top-3 z-30 h-[86%] rounded-md border border-hairline bg-paper shadow-paper"
        >
          <div className="space-y-2 p-4">
            <span className="block h-1.5 w-14 rounded-full bg-ink/15" />
            <span className="block h-1.5 w-full rounded-full bg-ink/10" />
            <span className="block h-1.5 w-4/5 rounded-full bg-ink/10" />
            <span className="block h-1.5 w-2/3 rounded-full bg-ink/10" />
          </div>
        </motion.div>
        <div className="absolute inset-0 z-10 overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-b from-[#FFFDF7] via-[#FBF4E7] to-[#F5EADA] shadow-paper-lg transition-shadow duration-300 group-hover:shadow-[0_22px_60px_rgba(81,68,61,0.18)]">
          <svg
            viewBox="0 0 300 200"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path d="M0 200 L150 104 L300 200 Z" fill="#F8EFE0" opacity=".9" />
            <path
              d="M0 0 L120 112 L0 200"
              fill="none"
              stroke="#E8DCC8"
              strokeWidth="1.4"
            />
            <path
              d="M300 0 L180 112 L300 200"
              fill="none"
              stroke="#E8DCC8"
              strokeWidth="1.4"
            />
            <path
              d="M0 200 L150 104 L300 200"
              fill="none"
              stroke="#E8DCC8"
              strokeWidth="1.4"
            />
          </svg>
        </div>
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ rotateX: opening ? -168 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-x-0 top-0 z-20 h-[58%]"
          style={{
            transformOrigin: "top center",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="h-full w-full border-x border-t border-hairline bg-gradient-to-b from-[#FFFDF7] to-[#F2E6D3]"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
          />
        </motion.div>
        <div
          aria-hidden="true"
          className={`absolute left-1/2 top-[52%] z-40 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-blush shadow-[0_4px_12px_rgba(81,68,61,0.18)] ring-1 ring-white/60 transition-opacity ${opening ? "opacity-0" : "opacity-100"}`}
        >
          <Heart className="h-5 w-5 text-white" />
        </div>
        {unread > 0 && !opening && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 z-50 h-3.5 w-3.5 rounded-full bg-blush-deep ring-2 ring-background"
          />
        )}
      </div>
    </button>
  );
}
