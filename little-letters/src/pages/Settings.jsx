import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Home, Heart, LogOut, PenLine } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/client";
import { isIOS, isStandalone } from "@/components/InstallGuide";
import { PageHeader, ErrorMessage } from "@/components/Common";
function Section({ icon, title, children }) {
  return (
    <section className="panel">
      <div className="flex items-center gap-2 text-ink-soft">
        {icon}
        <h2 className="text-[13px] font-medium tracking-wide text-ink">
          {title}
        </h2>
      </div>
      <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}
function applicationKey(value) {
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export default function Settings() {
  const { user, info, logout } = useAuth();
  const [registration, setRegistration] = useState(null),
    [subscription, setSubscription] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  const installNeeded = isIOS() && !isStandalone();
  useEffect(() => {
    if (!supported || user.role !== "reader") return;
    let active = true;
    navigator.serviceWorker.ready.then(async (reg) => {
      if (!active) return;
      setRegistration(reg);
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await api("push", { method: "POST", body: sub.toJSON() });
          if (active) setSubscription(sub);
        } catch (e) {
          if (active) setError(e.message);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [supported, user.role]);
  // subscribe() is called directly by the tap handler, before unrelated asynchronous work.
  function enable() {
    if (!registration || !publicKey) return;
    setBusy(true);
    setError("");
    setMessage("");
    let promise;
    try {
      promise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationKey(publicKey),
      });
    } catch (e) {
      setError(e.message);
      setBusy(false);
      return;
    }
    promise
      .then(async (sub) => {
        await api("push", { method: "POST", body: sub.toJSON() });
        setSubscription(sub);
        setMessage("Notifications are on for this device.");
      })
      .catch(() => {
        setError(
          Notification.permission === "denied"
            ? "Notifications are blocked. Allow them in your phone’s notification settings, then try again."
            : "Could not enable notifications. Reopen this app from your Home Screen and try again.",
        );
      })
      .finally(() => setBusy(false));
  }
  async function disable() {
    setBusy(true);
    setError("");
    try {
      await api("push", {
        method: "DELETE",
        body: { endpoint: subscription.endpoint },
      });
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage("Notifications are off for this device.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }
  return (
    <main className="min-h-[100dvh] bg-background px-5 pb-16">
      <div className="safe-t mx-auto w-full max-w-[560px]">
        <PageHeader title="Settings" />
        <div className="mt-7 space-y-4">
          <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
            {user.role === "admin" ? (
              <>
                <p>
                  Your reader can turn on “You got mail!” notifications from
                  this page on their phone.
                </p>
                <p>
                  {info.pushConfigured
                    ? "Push notifications are configured."
                    : "Push notifications have not been set up yet. See the setup guide included with your project."}
                </p>
                {!info.readerConfigured && (
                  <p>
                    Add your reader’s account to finish setting up the mailbox.
                  </p>
                )}
              </>
            ) : (
              <>
                <p>
                  Get a little “You got mail!” when a new letter arrives. The
                  notification never includes the letter itself.
                </p>
                {installNeeded ? (
                  <p>
                    Add this app to your Home Screen, open it from there, then
                    come back to turn on notifications.
                  </p>
                ) : !supported ? (
                  <p>
                    This browser does not support notifications. Your letters
                    are still here whenever you open the app.
                  </p>
                ) : !publicKey || !info.pushConfigured ? (
                  <p>
                    Notifications aren’t set up yet. You can still read all your
                    letters.
                  </p>
                ) : subscription ? (
                  <button className="btn" onClick={disable} disabled={busy}>
                    Turn off notifications
                  </button>
                ) : (
                  <button
                    className="btn-dark"
                    onClick={enable}
                    disabled={busy || !registration}
                  >
                    {busy
                      ? "Connecting…"
                      : registration
                        ? "Enable notifications"
                        : "Getting ready…"}
                  </button>
                )}
              </>
            )}
            {message && <p role="status">{message}</p>}
          </Section>
          <ErrorMessage error={error} />
          <Section
            icon={<Home className="h-4 w-4" />}
            title="Keep it on your Home Screen"
          >
            <ol className="list-decimal space-y-1 pl-4">
              <li>Open Little Letters in Safari.</li>
              <li>Tap Share, then “Add to Home Screen”.</li>
              <li>Open it using the new envelope icon.</li>
            </ol>
            <p>Sign in there once, then enable notifications.</p>
          </Section>
          <Section icon={<Heart className="h-4 w-4" />} title="Account">
            <p className="break-all text-ink">{user.email}</p>
            <p>{user.role === "admin" ? "Letter writer" : "Reader"}</p>
            <button className="btn" onClick={signOut} disabled={busy}>
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </Section>
          {user.role === "admin" && (
            <Link
              to="/write"
              className="panel flex items-center justify-between text-[13px]"
            >
              <span className="inline-flex items-center gap-2">
                <PenLine className="h-4 w-4" />
                Open the writing desk
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
