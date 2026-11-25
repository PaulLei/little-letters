import { Link } from "react-router-dom";
import { EnvelopeDoodle, Heart } from "@/components/Decor";
import { PageHeader, ErrorMessage, Skeleton } from "@/components/Common";
import { useLetters } from "@/lib/useLetters";
import { formatSentAt, letterPreview, letterTitle } from "@/lib/letterText";
export default function Archive() {
  const { letters, error, hasMore, busy, reload, more } = useLetters();
  return (
    <main className="min-h-[100dvh] bg-background px-5 pb-16">
      <div className="safe-t mx-auto w-full max-w-[620px]">
        <PageHeader
          title="Archive"
          subtitle="Every little letter, kept safe."
        />
        <ErrorMessage error={error} onRetry={reload} />
        {!letters && !error && <Skeleton />}
        {letters?.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <EnvelopeDoodle className="h-14 w-20 text-ink/20" />
            <p className="font-body text-ink-soft">
              No letters yet. The box is waiting.
            </p>
          </div>
        )}
        <ul className="mt-8 space-y-3">
          {letters?.map((letter) => (
            <li key={letter.id}>
              <Link
                to={`/letters/${letter.id}`}
                className="flex items-start gap-4 rounded-xl border border-hairline bg-paper px-4 py-4 shadow-paper transition-transform hover:-translate-y-0.5"
              >
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-[4px] border border-dashed border-ink/20 text-ink/35">
                  <EnvelopeDoodle className="h-6 w-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-body text-[16px]">
                      {letterTitle(letter)}
                    </span>
                    {!letter.readAt && (
                      <span
                        aria-label="Unread"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-blush-deep"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-soft">
                    {formatSentAt(letter.sentAt)}
                  </span>
                  <span className="mt-2 block line-clamp-2 break-words font-body text-[14px] leading-relaxed text-ink-soft">
                    {letterPreview(letter.body, 110)}
                  </span>
                </span>
                <Heart className="mt-1 h-3 w-3 shrink-0 text-blush/80" />
              </Link>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button className="btn mt-6" onClick={more} disabled={busy}>
            {busy ? "Loading…" : "More letters"}
          </button>
        )}
      </div>
    </main>
  );
}
