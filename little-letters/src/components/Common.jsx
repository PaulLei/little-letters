import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Flower } from "./Decor";
export function PageHeader({ title, subtitle }) {
  return (
    <>
      <Link
        to="/"
        className="inline-flex min-h-[44px] items-center gap-2 text-[13px] text-ink-soft"
      >
        <ArrowLeft className="h-4 w-4" />
        Mailbox
      </Link>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <h1 className="font-display text-[34px] leading-none">{title}</h1>
          {subtitle && (
            <p className="mt-2 font-body text-[14px] italic text-ink-soft">
              {subtitle}
            </p>
          )}
        </div>
        <Flower className="mb-1 h-6 w-6 text-sage" />
      </div>
    </>
  );
}
export function ErrorMessage({ error, onRetry }) {
  return error ? (
    <div
      role="alert"
      className="my-5 rounded-xl border border-destructive/30 bg-paper p-4 text-sm"
    >
      <p className="text-destructive">{error}</p>
      {onRetry && (
        <button className="btn mt-3" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  ) : null;
}
export function Skeleton() {
  return (
    <div role="status" aria-label="Loading letters" className="mt-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-xl border border-hairline bg-paper/60"
        />
      ))}
    </div>
  );
}
