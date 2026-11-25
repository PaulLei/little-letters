import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";
export function useLetters(status = "sent") {
  const [letters, setLetters] = useState(null),
    [error, setError] = useState(""),
    [hasMore, setHasMore] = useState(false),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const run = ++generation.current;
    setError("");
    try {
      const result = await api(`letters?status=${status}`);
      if (run === generation.current) {
        setLetters(result.letters);
        setHasMore(result.hasMore);
      }
    } catch (e) {
      if (run === generation.current) setError(e.message);
    }
  }, [status]);
  useEffect(() => {
    setLetters(null);
    reload();
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      generation.current++;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [reload]);
  const more = async () => {
    if (busy) return;
    setBusy(true);
    const run = generation.current;
    try {
      const result = await api(
        `letters?status=${status}&offset=${letters.length}`,
      );
      if (run === generation.current) {
        setLetters((old) => [
          ...old,
          ...result.letters.filter((n) => !old.some((o) => o.id === n.id)),
        ]);
        setHasMore(result.hasMore);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return { letters, error, hasMore, busy, reload, more };
}
