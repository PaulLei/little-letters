export function formatSentAt(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)} · ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date)}`;
}
export const letterTitle = (letter) =>
  letter?.title?.trim() || "A little letter";
export function letterPreview(body, max = 120) {
  const text = (body || "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
}
export function notificationLabel(letter) {
  return (
    {
      accepted: "Push accepted",
      pending: "Notification pending",
      sending: "Sending notification…",
      failed: "Notification failed",
      unconfigured: "Push not configured",
      unavailable: "No device enabled",
      none: "No notification",
    }[letter.notificationStatus] || "No notification"
  );
}
