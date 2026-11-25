import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(
  url && key && !url.includes("YOUR_PROJECT") && !key.startsWith("YOUR_"),
);
export const supabase = configured ? createClient(url, key) : null;

export async function api(path, { method = "GET", body, signal } = {}) {
  if (!supabase) throw new Error("The mailbox has not been configured.");
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) throw new Error("Please sign in again.");
  const response = await fetch(`/api/${path}`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server could not be reached. Please try again.");
  }
  if (!response.ok)
    throw Object.assign(new Error(data.error || "Request failed."), {
      status: response.status,
    });
  return data;
}
