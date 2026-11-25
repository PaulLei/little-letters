import * as webpush from "web-push";
import { dbResult, HttpError } from "./core.js";

export function pushConfigured() {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT,
  );
}
// Subscription endpoints cause outbound requests. Only known browser push services are allowed.
export function validateEndpoint(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new HttpError(400, "Invalid push subscription.");
  }
  const h = url.hostname;
  const allowed =
    h === "web.push.apple.com" ||
    h.endsWith(".push.apple.com") ||
    h === "fcm.googleapis.com" ||
    h === "updates.push.services.mozilla.com" ||
    h.endsWith(".notify.windows.com");
  if (
    !allowed ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new HttpError(
      400,
      "Unsupported push service. Use Safari, Chrome, Firefox, or Edge.",
    );
  }
  return url.href;
}

export async function notifyLetter(db, id, retry = false) {
  const claimed = dbResult(
    await db.rpc("claim_notification", { p_id: id, p_retry: retry }),
  );
  if (!claimed) return;
  let status = "failed",
    note = "Notification could not be sent. You can retry from Sent.";
  try {
    if (!pushConfigured()) {
      status = "unconfigured";
      note = "Push is not configured. Your letter is available in the mailbox.";
    } else {
      const reader = dbResult(
        await db
          .from("members")
          .select("user_id")
          .eq("role", "reader")
          .maybeSingle(),
      );
      const subscriptions = reader
        ? dbResult(
            await db
              .from("push_subscriptions")
              .select("*")
              .eq("user_id", reader.user_id)
              .limit(10),
          )
        : [];
      if (!subscriptions.length) {
        status = "unavailable";
        note = "The reader has not enabled notifications on a device yet.";
      } else {
        const outcomes = await Promise.all(
          subscriptions.map(async (s) => {
            try {
              validateEndpoint(s.endpoint);
              await webpush.sendNotification(
                s.subscription,
                JSON.stringify({
                  title: "You got mail!",
                  url: `/letters/${id}`,
                  tag: `letter-${id}`,
                }),
                {
                  vapidDetails: {
                    subject: process.env.VAPID_SUBJECT,
                    publicKey: process.env.VAPID_PUBLIC_KEY,
                    privateKey: process.env.VAPID_PRIVATE_KEY,
                  },
                  TTL: 86400,
                  urgency: "normal",
                  timeout: 10000,
                },
              );
              return true;
            } catch (error) {
              if ([404, 410].includes(error.statusCode))
                await db.from("push_subscriptions").delete().eq("id", s.id);
              return false;
            }
          }),
        );
        const accepted = outcomes.filter(Boolean).length;
        status = accepted ? "accepted" : "failed";
        note = accepted
          ? `Push service accepted ${accepted} of ${subscriptions.length} device notifications. Phone delivery is not confirmed.`
          : "No device accepted the notification. Re-enable notifications on the reader’s phone, then retry.";
      }
    }
  } catch {
    /* Publish is already saved; a notification failure must not undo it. */
  }
  dbResult(
    await db
      .from("letters")
      .update({ notification_status: status, notification_note: note })
      .eq("id", id),
  );
}
