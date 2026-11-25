import { useEffect, useState } from "react";
import { Routes, Route, Link, NavLink, useParams } from "react-router-dom";
import { ArrowLeft, PenLine, Trash2, BellRing } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/client";
import { useLetters } from "@/lib/useLetters";
import {
  formatSentAt,
  letterTitle,
  letterPreview,
  notificationLabel,
} from "@/lib/letterText";
import LetterEditor from "@/components/LetterEditor";
import { Flower } from "@/components/Decor";
import { ErrorMessage, Skeleton } from "@/components/Common";
function NewLetter() {
  return (
    <>
      <div className="mb-5 flex items-center gap-2 text-ink-soft">
        <PenLine className="h-4 w-4 shrink-0" />
        <p className="text-[12px] tracking-wide">
          A new little letter — everyday moments count most.
        </p>
      </div>
      <LetterEditor key="new" />
    </>
  );
}
function EditLetter() {
  const { letterId } = useParams();
  const [letter, setLetter] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLetter(null);
    setError("");
    api(`letters?id=${encodeURIComponent(letterId)}`)
      .then((data) => {
        if (active) setLetter(data.letter);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [letterId, attempt]);
  return (
    <>
      <ErrorMessage error={error} onRetry={() => setAttempt((n) => n + 1)} />
      {letter ? (
        <LetterEditor key={letter.id} letter={letter} />
      ) : !error ? (
        <Skeleton />
      ) : null}
    </>
  );
}
function WriterList({ status }) {
  const {
    letters,
    error,
    hasMore,
    busy: loadingMore,
    reload,
    more,
  } = useLetters(status);
  const [busy, setBusy] = useState(null),
    [actionError, setActionError] = useState("");
  async function act(letter) {
    if (
      status === "draft" &&
      !window.confirm(
        `Delete draft “${letterTitle(letter)}”? This cannot be undone.`,
      )
    )
      return;
    setBusy(letter.id);
    setActionError("");
    try {
      if (status === "draft")
        await api(`letters?id=${letter.id}`, { method: "DELETE" });
      else
        await api("letters", {
          method: "POST",
          body: { id: letter.id, action: "retry" },
        });
      await reload();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-[12px] text-ink-soft">
          {status === "draft"
            ? "Only you can see these."
            : "Your sent letters, kept in the archive."}
        </p>
        <Link to="/write" className="btn-dark shrink-0">
          <PenLine className="h-3.5 w-3.5" />
          New letter
        </Link>
      </div>
      <ErrorMessage error={error || actionError} onRetry={reload} />
      {!letters && !error && <Skeleton />}
      {letters?.length === 0 && (
        <p className="rounded-xl border border-dashed border-hairline px-5 py-12 text-center font-body text-ink-soft">
          {status === "draft"
            ? "Nothing in drafts. Half-written thoughts are safe here."
            : "No letters sent yet."}
        </p>
      )}
      <ul className="space-y-3">
        {letters?.map((letter) => (
          <li
            key={letter.id}
            className="rounded-xl border border-hairline bg-paper p-4 shadow-paper"
          >
            <div className="flex items-start gap-3">
              <Link to={`/write/${letter.id}`} className="min-w-0 flex-1">
                <p className="truncate font-body text-[16px]">
                  {letterTitle(letter)}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-soft">
                  {status === "draft" ? "Last saved " : ""}
                  {formatSentAt(
                    status === "draft" ? letter.updatedAt : letter.sentAt,
                  )}
                </p>
                <p className="mt-2 line-clamp-2 break-words font-body text-[14px] text-ink-soft">
                  {letterPreview(letter.body, 110) || "Nothing written yet."}
                </p>
              </Link>
              {status === "draft" ? (
                <button
                  aria-label={`Delete draft ${letterTitle(letter)}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft hover:text-destructive"
                  disabled={busy === letter.id}
                  onClick={() => act(letter)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {status === "sent" && (
              <div className="mt-3 border-t border-dashed border-hairline pt-3">
                <p className="text-xs text-ink-soft">
                  {notificationLabel(letter)}
                </p>
                {letter.notificationNote && (
                  <p className="mt-1 text-[11px] text-ink-soft">
                    {letter.notificationNote}
                  </p>
                )}
                {[
                  "failed",
                  "unavailable",
                  "unconfigured",
                  "pending",
                  "sending",
                ].includes(letter.notificationStatus) && (
                  <button
                    className="btn mt-2"
                    disabled={busy === letter.id}
                    onClick={() => act(letter)}
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    {busy === letter.id ? "Trying…" : "Retry notification"}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button className="btn mt-6" onClick={more} disabled={loadingMore}>
          More letters
        </button>
      )}
    </>
  );
}
export default function WritingDesk() {
  const { user } = useAuth();
  if (user.role !== "admin")
    return (
      <main className="grid min-h-[100dvh] place-items-center px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <Flower className="h-8 w-8 text-sage" />
          <p className="font-body text-lg">
            This is the writing desk — only the letter writer can be here.
          </p>
          <Link to="/" className="btn">
            Back to the mailbox
          </Link>
        </div>
      </main>
    );
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="safe-t border-b border-hairline/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 pb-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to the mailbox"
              className="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-paper text-ink-soft"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-display text-[24px] leading-none">
                Writing desk
              </h1>
              <p className="mt-0.5 text-[11px] tracking-wide text-ink-soft">
                Little Letters
              </p>
            </div>
          </div>
          <nav
            aria-label="Writing desk"
            className="flex gap-1 rounded-full border border-hairline bg-paper p-1"
          >
            {[
              ["/write", "Write"],
              ["/write/drafts", "Drafts"],
              ["/write/sent", "Sent"],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/write"}
                className={({ isActive }) =>
                  `inline-flex min-h-[44px] items-center rounded-full px-3.5 text-xs ${isActive ? "bg-ink text-paper" : "text-ink-soft"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-5">
        <Routes>
          <Route index element={<NewLetter />} />
          <Route
            path="drafts"
            element={<WriterList key="drafts" status="draft" />}
          />
          <Route
            path="sent"
            element={<WriterList key="sent" status="sent" />}
          />
          <Route path=":letterId" element={<EditLetter />} />
        </Routes>
      </main>
    </div>
  );
}
