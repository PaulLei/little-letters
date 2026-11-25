import LetterBody from "./LetterBody";
import { Flower, Heart, StampMark, WashiTape } from "./Decor";
import { formatSentAt } from "@/lib/letterText";
const STATIONERY = {
  cream: {
    sheet: "bg-[#FFFDF7] border-hairline",
    tape: "blush",
    stamp: "text-blush-deep/70",
  },
  sage: {
    sheet: "bg-[#F8FAF3] border-sage/60",
    tape: "sage",
    stamp: "text-ink/40",
  },
  blush: {
    sheet: "bg-[#FFF8F8] border-blush",
    tape: "blush",
    stamp: "text-blush-deep/80",
  },
  butter: {
    sheet: "bg-[#FFFBEF] border-butter",
    tape: "butter",
    stamp: "text-ink/40",
  },
};
export default function LetterPaper({ letter, className = "" }) {
  const style = STATIONERY[letter?.stationeryStyle] || STATIONERY.cream;
  return (
    <article
      className={`paper-grain relative w-full rounded-[6px] border shadow-paper-lg ${style.sheet} ${className}`}
    >
      <WashiTape className="-top-2.5 left-6 sm:left-10" tone={style.tape} />
      <div className="absolute right-5 top-5 sm:right-8 sm:top-7">
        <StampMark
          className={`h-12 w-10 rotate-[3deg] rounded-[2px] ${style.stamp}`}
        >
          <Flower className="h-5 w-5" />
        </StampMark>
      </div>
      <div className="px-6 pb-10 pt-20 sm:px-12 sm:pb-14 sm:pt-20">
        {letter?.title?.trim() && (
          <p className="mb-5 break-words font-body text-[14px] italic tracking-wide text-ink-soft">
            {letter.title.trim()}
          </p>
        )}
        {letter?.greeting?.trim() && (
          <p className="mb-4 break-words font-display text-[28px] leading-tight text-ink">
            {letter.greeting.trim()}
          </p>
        )}
        <LetterBody body={letter?.body} />
        {letter?.signature?.trim() && (
          <p className="mt-9 whitespace-pre-wrap break-words font-display text-[24px] leading-tight text-ink">
            {letter.signature.trim()}
          </p>
        )}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-dashed border-hairline pt-3">
          <p className="font-ui text-[12px] text-ink-soft">
            {formatSentAt(letter?.sentAt) || "Not sent yet"}
          </p>
          <Heart className="h-3.5 w-3.5 shrink-0 text-blush-deep/60" />
        </div>
      </div>
    </article>
  );
}
