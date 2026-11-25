import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, Settings, WifiOff } from "lucide-react";
import { api } from "@/lib/client";
import { useAuth } from "@/lib/AuthContext";
import { useOnline } from "@/lib/useOnline";
import Envelope from "@/components/Envelope";
import InstallGuide from "@/components/InstallGuide";
import { EnvelopeDoodle, Flower, Sparkle, StampMark } from "@/components/Decor";
import { ErrorMessage } from "@/components/Common";

export default function Mailbox() {
  const navigate = useNavigate(),
    online = useOnline(),
    { user } = useAuth();
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const run = useRef(0);
  const load = useCallback(async () => {
    const current = ++run.current;
    try {
      const [unread, latest] = await Promise.all([
        api("letters?unread=true&order=oldest"),
        api("letters"),
      ]);
      if (current !== run.current) return;
      setData({
        unread: unread.unreadCount,
        target: unread.letters[0] || latest.letters[0],
      });
      setError("");
      if (user.role === "reader" && "setAppBadge" in navigator) {
        (unread.unreadCount
          ? navigator.setAppBadge(unread.unreadCount)
          : navigator.clearAppBadge()
        ).catch(() => {});
      }
    } catch (e) {
      if (current === run.current) setError(e.message);
    }
  }, [user.role]);
  useEffect(() => {
    load();
    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      run.current++;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  const open = useCallback(() => {
    if (data?.target) navigate(`/letters/${data.target.id}`);
  }, [data?.target?.id, navigate]);
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Sparkle className="absolute left-[12%] top-[22%] h-4 w-4 text-ink/20" />
        <Sparkle className="absolute right-[16%] top-[30%] h-3 w-3 text-blush-deep/30" />
        <span className="absolute bottom-[24%] left-[18%] h-2 w-2 rounded-full bg-butter" />
        <span className="absolute right-[22%] top-[18%] h-1.5 w-1.5 rounded-full bg-sage" />
      </div>
      <header className="safe-t relative z-10 flex items-center justify-center gap-2 px-6">
        <h1 className="font-display text-[26px] leading-none tracking-wide">
          Little Letters
        </h1>
        <Flower className="h-4 w-4 text-sage" />
      </header>
      {!online && (
        <div className="mx-auto mt-4 flex items-center gap-2 px-5 text-center text-xs text-ink-soft">
          <WifiOff className="h-4 w-4 shrink-0" />
          You’re offline — reconnect to check your letters.
        </div>
      )}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">
        <ErrorMessage error={error} onRetry={load} />
        <p
          className="mb-8 max-w-[17rem] text-center font-body text-[20px] leading-relaxed"
          aria-live="polite"
        >
          {!data
            ? error
              ? ""
              : "Checking your mailbox…"
            : data.unread
              ? "You have mail!"
              : data.target
                ? "All caught up."
                : "Your first letter will arrive here."}
        </p>
        <Envelope
          unread={data?.unread || 0}
          onOpen={open}
          disabled={!data?.target}
          label={
            data?.unread
              ? "Open your oldest unread letter"
              : "Read your last letter"
          }
        />
        <div className="mt-8 flex min-h-[2.5rem] flex-col items-center gap-3">
          {data?.unread > 0 ? (
            <p className="text-[13px] tracking-wide text-ink-soft">
              {data.unread} {data.unread === 1 ? "letter" : "letters"} waiting
            </p>
          ) : data?.target ? (
            <button type="button" className="btn shadow-paper" onClick={open}>
              Read your last letter
            </button>
          ) : data ? (
            <EnvelopeDoodle className="h-10 w-14 text-ink/25" />
          ) : null}
        </div>
        <InstallGuide />
      </section>
      <footer className="safe-b relative z-10 flex items-end justify-between px-6">
        <Link
          to="/archive"
          className="flex min-h-[44px] items-center gap-2 px-2 py-2 text-[13px] text-ink-soft"
        >
          <StampMark className="h-8 w-8 rotate-[-4deg] rounded-[3px]">
            <Archive className="h-4 w-4" />
          </StampMark>
          Archive
        </Link>
        <Link
          to="/settings"
          aria-label="Settings"
          className="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-paper text-ink-soft shadow-paper"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}
