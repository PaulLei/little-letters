import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { Bold, Italic, Loader2, Send, Check } from "lucide-react";
import { api } from "@/lib/client";
import { DraftSession } from "@/lib/DraftSession";
import { useOnline } from "@/lib/useOnline";
import LetterPaper from "./LetterPaper";
import StationeryPicker from "./StationeryPicker";

const blank = () => ({
  title: "",
  greeting: "",
  body: "",
  signature: "",
  stationeryStyle: "cream",
});
function content(letter) {
  return letter
    ? {
        title: letter.title,
        greeting: letter.greeting,
        body: letter.body,
        signature: letter.signature,
        stationeryStyle: letter.stationeryStyle,
      }
    : blank();
}
export default function LetterEditor({ letter }) {
  const online = useOnline();
  const [form, setForm] = useState(() => content(letter)),
    [saveState, setSaveState] = useState("idle"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [view, setView] = useState("edit"),
    [dirty, setDirty] = useState(false);
  const session = useRef(null);
  if (!session.current)
    session.current = new DraftSession(
      (data) => api("letters", { method: "POST", body: data }),
      letter,
    );
  const latest = useRef(form),
    revision = useRef(0),
    timer = useRef(null),
    textarea = useRef(null),
    alive = useRef(true),
    locked = useRef(false);
  const isSent = letter?.status === "sent";
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save(snapshot = latest.current, rev = revision.current) {
    if (locked.current) return;
    if (!online) {
      setSaveState("error");
      setError(
        "You’re offline. Keep this page open and save when you reconnect.",
      );
      return;
    }
    if (
      !Object.values(snapshot)
        .slice(0, 4)
        .some((value) => value.trim()) &&
      session.current.version === 0
    ) {
      setSaveState("idle");
      setDirty(false);
      return;
    }
    setSaveState("saving");
    try {
      await session.current.save(snapshot);
      if (alive.current && revision.current === rev) {
        setDirty(false);
        setSaveState("saved");
        setError("");
      }
    } catch (e) {
      if (alive.current) {
        setSaveState("error");
        setError(e.message);
      }
    }
  }
  function update(patch) {
    if (locked.current) return;
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setForm(next);
    setDirty(true);
    revision.current++;
    setNotice("");
    setError("");
    setSaveState("waiting");
    clearTimeout(timer.current);
    const rev = revision.current;
    timer.current = setTimeout(() => save(next, rev), 900);
  }
  async function submit() {
    if (locked.current) return;
    if (!latest.current.body.trim()) {
      setError("Write something in the letter body first.");
      return;
    }
    if (!online) {
      setError("You’re offline — your letter has not been sent.");
      return;
    }
    locked.current = true;
    clearTimeout(timer.current);
    setBusy(true);
    setError("");
    try {
      const result = isSent
        ? await session.current.save(latest.current)
        : await session.current.publish(latest.current);
      if (!alive.current) return;
      setDirty(false);
      setSaveState(isSent ? "saved" : "idle");
      setNotice(
        isSent
          ? "Letter updated. Its original send time is unchanged."
          : result.warning ||
              `Letter sent. ${result.letter.notificationStatus === "accepted" ? "Notification accepted by the push service." : result.letter.notificationNote || "Check Sent for notification status."}`,
      );
      if (!isSent) {
        // New letter, NEW UUID. Never reuse the ID of the sent letter.
        session.current = new DraftSession((data) =>
          api("letters", { method: "POST", body: data }),
        );
        const next = {
          ...blank(),
          stationeryStyle: latest.current.stationeryStyle,
        };
        latest.current = next;
        setForm(next);
        revision.current++;
      }
    } catch (e) {
      if (alive.current) {
        setError(e.message);
        setSaveState("error");
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function wrap(marker) {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const selected = value.slice(start, end) || "your words";
    update({
      body: `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`,
    });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + marker.length,
        start + marker.length + selected.length,
      );
    });
  }
  const toggle = (
    <div className="mb-4 flex gap-1 rounded-full border border-hairline bg-paper p-1 lg:hidden">
      {["edit", "preview"].map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          aria-pressed={view === mode}
          className={`min-h-[44px] flex-1 rounded-full text-xs ${view === mode ? "bg-ink text-paper" : "text-ink-soft"}`}
        >
          {mode === "edit" ? "Write" : "Preview"}
        </button>
      ))}
    </div>
  );
  return (
    <>
      {blocker.state === "blocked" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved changes"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-6"
        >
          <div className="panel max-w-sm">
            <p className="font-body text-lg">
              Your latest words aren’t saved yet.
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Stay here to save them, or leave and discard unsaved changes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                autoFocus
                className="btn-dark"
                onClick={() => blocker.reset()}
              >
                Keep writing
              </button>
              <button className="btn" onClick={() => blocker.proceed()}>
                Leave page
              </button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-5 flex gap-2 rounded-xl border border-sage/70 bg-sage/20 p-4 text-sm"
        >
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
        <div className={view === "preview" ? "hidden lg:block" : ""}>
          {toggle}
          <fieldset
            disabled={busy}
            className="space-y-4 rounded-xl border border-hairline bg-paper/70 px-4 py-5 sm:px-5"
          >
            {isSent && (
              <p className="rounded-lg bg-muted px-3 py-2 text-[11px] text-ink-soft">
                Editing a sent letter keeps its original date and does not
                notify again.
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[.14em] text-ink-soft">
                Letter
              </p>
              <span
                role="status"
                className={`text-[11px] ${saveState === "error" ? "text-destructive" : "text-ink-soft"}`}
              >
                {saveState === "saving" || saveState === "waiting"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved"
                    : saveState === "error"
                      ? "Couldn’t save. Try again."
                      : ""}
              </span>
            </div>
            <div>
              <label htmlFor="letter-title" className="field-label">
                Title (optional)
              </label>
              <input
                id="letter-title"
                className="field"
                maxLength={140}
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="A small Tuesday"
              />
            </div>
            <div>
              <label htmlFor="letter-greeting" className="field-label">
                Greeting (optional)
              </label>
              <input
                id="letter-greeting"
                className="field"
                maxLength={160}
                value={form.greeting}
                onChange={(e) => update({ greeting: e.target.value })}
                placeholder="My dearest,"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="letter-body" className="field-label">
                  Letter
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => wrap("**")}
                    aria-label="Bold"
                    className="grid h-11 w-11 place-items-center rounded-md border border-hairline"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => wrap("*")}
                    aria-label="Italic"
                    className="grid h-11 w-11 place-items-center rounded-md border border-hairline"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                id="letter-body"
                ref={textarea}
                rows={14}
                maxLength={20000}
                className="field resize-y font-body leading-relaxed"
                value={form.body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder="Tell them about an ordinary thing that made you smile today…"
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                Leave a blank line between paragraphs. Line breaks are kept.
              </p>
            </div>
            <div>
              <label htmlFor="letter-signature" className="field-label">
                Signature (optional)
              </label>
              <input
                id="letter-signature"
                className="field"
                maxLength={160}
                value={form.signature}
                onChange={(e) => update({ signature: e.target.value })}
                placeholder="Yours, always"
              />
            </div>
            <StationeryPicker
              value={form.stationeryStyle}
              onChange={(stationeryStyle) => update({ stationeryStyle })}
            />
            {error && (
              <p role="alert" className="text-[12px] text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                className="btn-dark"
                onClick={submit}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {busy ? "Saving…" : isSent ? "Save changes" : "Send Letter"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  clearTimeout(timer.current);
                  save();
                }}
              >
                {isSent ? "Save now" : "Save Draft"}
              </button>
            </div>
          </fieldset>
        </div>
        <div className={view === "edit" ? "hidden lg:block" : ""}>
          {toggle}
          <p className="mb-3 text-[11px] uppercase tracking-[.14em] text-ink-soft">
            As it will arrive
          </p>
          <div className="lg:sticky lg:top-6">
            <LetterPaper letter={{ ...form, sentAt: letter?.sentAt }} />
          </div>
        </div>
      </div>
    </>
  );
}
