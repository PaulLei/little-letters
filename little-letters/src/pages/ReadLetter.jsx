import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/lib/AuthContext";
import LetterPaper from "@/components/LetterPaper";
import { Flower, Sparkle } from "@/components/Decor";
import { ErrorMessage, Skeleton } from "@/components/Common";
export default function ReadLetter() {
  const { letterId } = useParams(),
    { user } = useAuth();
  const [letter, setLetter] = useState(null),
    [nextId, setNextId] = useState(null),
    [error, setError] = useState(""),
    [readError, setReadError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLetter(null);
    setError("");
    setReadError("");
    setNextId(null);
    window.scrollTo(0, 0);
    api(`letters?id=${encodeURIComponent(letterId)}`)
      .then(({ letter }) => {
        if (active) setLetter(letter);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [letterId, attempt]);
  // This effect runs after the letter content is rendered. Admin previews never mark it read.
  useEffect(() => {
    if (!letter) return;
    let active = true;
    (async () => {
      if (user.role === "reader" && !letter.readAt) {
        try {
          await api("letters", {
            method: "POST",
            body: { action: "read", id: letter.id },
          });
        } catch (e) {
          if (active)
            setReadError(
              "Your letter opened, but its read status could not be saved.",
            );
        }
      }
      try {
        const result = await api("letters?unread=true&order=oldest");
        if (active) {
          setNextId(result.letters.find((l) => l.id !== letter.id)?.id || null);
          if (user.role === "reader" && "setAppBadge" in navigator)
            (result.unreadCount
              ? navigator.setAppBadge(result.unreadCount)
              : navigator.clearAppBadge()
            ).catch(() => {});
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [letter?.id, user.role, attempt]);
  return (
    <main className="relative min-h-[100dvh] bg-background px-4 pb-16">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <Sparkle className="absolute left-[8%] top-[16%] h-4 w-4 text-ink/15" />
        <span className="absolute right-[10%] top-[42%] h-2 w-2 rounded-full bg-sage/70" />
      </div>
      <div className="relative mx-auto w-full max-w-[680px]">
        <div className="safe-t sticky top-0 z-20 -mx-4 bg-background/90 px-4 pb-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center gap-2 text-[13px] text-ink-soft"
            >
              <ArrowLeft className="h-4 w-4" />
              Mailbox
            </Link>
            {user.role === "admin" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-2.5 py-1 text-[11px] text-ink-soft">
                <Eye className="h-3 w-3" />
                Preview — read state unchanged
              </span>
            ) : (
              <Flower className="h-5 w-5 text-sage" />
            )}
          </div>
        </div>
        <ErrorMessage
          error={error || readError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
        {!letter && !error && <Skeleton />}
        {letter && (
          <div className="mt-4 animate-soft-in">
            <LetterPaper letter={letter} />
          </div>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          {nextId && (
            <Link to={`/letters/${nextId}`} className="btn-dark">
              Open next letter
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            to="/archive"
            className="inline-flex min-h-[44px] items-center text-[12px] text-ink-soft underline decoration-hairline underline-offset-4"
          >
            All letters in the archive
          </Link>
        </div>
      </div>
    </main>
  );
}
