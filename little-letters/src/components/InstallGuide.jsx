import { useState } from "react";
import { X } from "lucide-react";
export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true;
export default function InstallGuide() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem("install-dismissed") === "1";
    } catch {
      return false;
    }
  });
  if (hidden || !isIOS() || isStandalone()) return null;
  return (
    <div className="mx-auto mt-6 flex w-full max-w-[19rem] items-start gap-2 rounded-xl border border-hairline bg-paper/80 px-3.5 py-3 shadow-paper">
      <p className="flex-1 text-left font-ui text-[12px] leading-relaxed text-ink-soft">
        Keep it close:{" "}
        <span className="text-ink">
          Open in Safari → Share → Add to Home Screen.
        </span>
      </p>
      <button
        type="button"
        aria-label="Dismiss home screen tip"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem("install-dismissed", "1");
          } catch {}
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
