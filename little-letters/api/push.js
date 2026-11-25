import { z } from "zod";
import { endpoint, dbResult, bodyOf, HttpError } from "../server/core.js";
import { validateEndpoint } from "../server/notifications.js";
const schema = z.object({
  endpoint: z.string().max(2999),
  keys: z.object({
    p256dh: z.string().regex(/^[A-Za-z0-9_-]{80,100}$/),
    auth: z.string().regex(/^[A-Za-z0-9_-]{20,30}$/),
  }),
  expirationTime: z.number().nullable().optional(),
});
export default endpoint(async (req, { db, user, member }) => {
  if (member.role !== "reader")
    throw new HttpError(403, "Notifications are for the reader’s devices.");
  const body = bodyOf(req);
  if (req.method === "DELETE") {
    const endpoint = z.string().max(2999).parse(body.endpoint);
    dbResult(
      await db
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint)
        .eq("user_id", user.id),
    );
    return { ok: true };
  }
  if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");
  const subscription = schema.parse(body);
  validateEndpoint(subscription.endpoint);
  const current = dbResult(
    await db
      .from("push_subscriptions")
      .select("endpoint")
      .eq("user_id", user.id),
  );
  if (
    current.length >= 10 &&
    !current.some((s) => s.endpoint === subscription.endpoint)
  )
    throw new HttpError(
      400,
      "This mailbox already has 10 subscribed devices. Remove an old device first.",
    );
  dbResult(
    await db
      .from("push_subscriptions")
      .upsert(
        { user_id: user.id, endpoint: subscription.endpoint, subscription },
        { onConflict: "endpoint" },
      ),
  );
  return { ok: true };
});
