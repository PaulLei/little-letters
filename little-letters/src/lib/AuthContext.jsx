import { createContext, useContext, useEffect, useState } from "react";
import { supabase, configured, api } from "./client";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!configured) {
      setSession(null);
      setChecking(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active) {
        setSession(data.session);
        if (error) setError("Please sign in again.");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (session === undefined) return;
    setError("");
    if (!session) {
      setInfo(null);
      setChecking(false);
      return;
    }
    setInfo((previous) =>
      previous?.user.id === session.user.id ? previous : null,
    );
    let active = true;
    setChecking(true);
    api("session")
      .then((data) => {
        if (active) setInfo(data);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          if ([401, 403].includes(e.status)) setInfo(null);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [session?.access_token, attempt]);

  async function logout() {
    // Remove the device registration before dropping its authenticated session.
    if (info?.user.role === "reader" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager?.getSubscription();
      if (sub) {
        try {
          await api("push", {
            method: "DELETE",
            body: { endpoint: sub.endpoint },
          });
        } catch {
          /* Local unsubscribe also revokes delivery. */
        }
        await sub.unsubscribe();
      }
    }
    await supabase.auth.signOut({ scope: "local" });
    setInfo(null);
    setSession(null);
    if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
  }
  return (
    <AuthContext.Provider
      value={{
        user: info?.user,
        info,
        session,
        loading: checking || session === undefined,
        error,
        logout,
        retry: () => setAttempt((n) => n + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
