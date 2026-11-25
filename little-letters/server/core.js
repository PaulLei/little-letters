import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const uuid = z.string().uuid();
export const letterInput = z.object({
  id: uuid,
  version: z.number().int().min(0),
  action: z.enum(["save", "publish", "edit_sent"]),
  title: z.string().max(140),
  greeting: z.string().max(160),
  body: z.string().max(20000),
  signature: z.string().max(160),
  stationeryStyle: z.enum(["cream", "sage", "blush", "butter"]),
});
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function mustAdmin(member) {
  if (member.role !== "admin")
    throw new HttpError(403, "Only the letter writer can do that.");
}
export function dbResult(result) {
  if (result.error) {
    if (result.error.code === "40001")
      throw new HttpError(409, result.error.message);
    throw new Error(
      `Database operation failed (${result.error.code || "unknown"}).`,
    );
  }
  return result.data;
}
export function serviceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new HttpError(503, "The mailbox is not configured yet.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticate(req) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "Please sign in.");
  const db = serviceClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user)
    throw new HttpError(401, "Your session expired. Please sign in again.");
  const member = dbResult(
    await db
      .from("members")
      .select("user_id,role")
      .eq("user_id", data.user.id)
      .maybeSingle(),
  );
  if (!member)
    throw new HttpError(403, "This private mailbox is invitation-only.");
  return { db, user: data.user, member };
}
export function bodyOf(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      throw new HttpError(400, "Invalid request.");
    }
  }
  if (!body || typeof body !== "object" || JSON.stringify(body).length > 150000)
    throw new HttpError(400, "Invalid request.");
  return body;
}
export function endpoint(handler) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    try {
      if (!["GET", "POST", "DELETE"].includes(req.method))
        throw new HttpError(405, "Method not allowed.");
      const ctx = await authenticate(req);
      const data = await handler(req, ctx);
      res.status(200).json(data);
    } catch (error) {
      const status = error instanceof z.ZodError ? 400 : error.status || 500;
      // Do not expose tokens, SQL, addresses or provider error bodies.
      res
        .status(status)
        .json({
          error:
            status === 500
              ? "The request could not be completed. Please try again."
              : error instanceof z.ZodError
                ? "Some fields are invalid or too long."
                : error.message,
        });
    }
  };
}
export function presentLetter(row) {
  return {
    id: row.id,
    title: row.title,
    greeting: row.greeting,
    body: row.body,
    signature: row.signature,
    stationeryStyle: row.stationery_style,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
    readAt: row.read_at,
    notificationStatus: row.notification_status,
    notificationNote: row.notification_note,
  };
}
