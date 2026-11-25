import { Component, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { configured, supabase } from "@/lib/client";
import { Heart, EnvelopeDoodle } from "@/components/Decor";
import Mailbox from "@/pages/Mailbox";
import Archive from "@/pages/Archive";
import ReadLetter from "@/pages/ReadLetter";
import Settings from "@/pages/Settings";
import WritingDesk from "@/pages/WritingDesk";

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Centered>
        <p>Something went wrong opening the mailbox.</p>
        <button className="btn" onClick={() => location.reload()}>
          Try again
        </button>
      </Centered>
    ) : (
      this.props.children
    );
  }
}
export function Centered({ children }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        {children}
      </div>
    </main>
  );
}
function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (result.error) throw result.error;
    } catch {
      setError("Could not sign in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Centered>
      <EnvelopeDoodle className="h-16 w-24 text-blush-deep/70" />
      <div>
        <h1 className="font-display text-[38px]">Little Letters</h1>
        <p className="mt-2 font-body text-[15px] italic text-ink-soft">
          A little place, just for you.
        </p>
      </div>
      <form onSubmit={submit} className="panel w-full space-y-4 text-left">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button className="btn-dark w-full" disabled={busy}>
          {busy ? "Opening…" : "Open your mailbox"}
        </button>
      </form>
      <p className="text-xs text-ink-soft">This mailbox is invitation-only.</p>
      <Heart className="h-4 w-4 text-blush-deep/60" />
    </Centered>
  );
}
function Gate() {
  const { user, session, loading, error, retry, logout } = useAuth();
  const location = useLocation();
  if (loading && !user)
    return (
      <Centered>
        <Heart className="h-6 w-6 animate-pulse text-blush-deep" />
        <p className="font-body text-ink-soft" role="status">
          Opening the mailbox…
        </p>
      </Centered>
    );
  if (error && session && !user)
    return (
      <Centered>
        <p role="alert">{error}</p>
        <button className="btn" onClick={retry}>
          Try again
        </button>
        <button className="btn" onClick={logout}>
          Sign out
        </button>
      </Centered>
    );
  if (!user) return <Login />;
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<Mailbox />} />
        <Route path="/login" element={<Mailbox />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/letters/:letterId" element={<ReadLetter />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/write/*" element={<WritingDesk />} />
        <Route
          path="*"
          element={
            <Centered>
              <p>This page isn’t here.</p>
              <Link className="btn" to="/">
                Back to the mailbox
              </Link>
            </Centered>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
export default function App() {
  if (!configured)
    return (
      <Centered>
        <EnvelopeDoodle className="h-16 w-24 text-blush-deep/70" />
        <h1 className="font-display text-[38px]">Little Letters</h1>
        <p className="font-body">Your mailbox is ready for setup.</p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Add the Supabase environment variables in Vercel, then redeploy. The
          included START_HERE guide walks you through it.
        </p>
      </Centered>
    );
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
