import {
  endpoint,
  dbResult,
  bodyOf,
  uuid,
  letterInput,
  mustAdmin,
  presentLetter,
  HttpError,
} from "../server/core.js";
import { notifyLetter } from "../server/notifications.js";

export async function handleLetters(req, { db, member }) {
  const url = new URL(req.url, "https://mailbox.invalid");
  if (req.method === "GET") {
    if (url.searchParams.has("id")) {
      const id = uuid.parse(url.searchParams.get("id"));
      let query = db.from("letters").select("*").eq("id", id);
      if (member.role !== "admin") query = query.eq("status", "sent");
      const row = dbResult(await query.maybeSingle());
      if (!row) throw new HttpError(404, "This letter isn’t here.");
      return { letter: presentLetter(row) };
    }
    const status =
      url.searchParams.get("status") === "draft" ? "draft" : "sent";
    if (status === "draft") mustAdmin(member);
    const offset = Math.max(
      0,
      Math.min(1000000, Number(url.searchParams.get("offset")) || 0),
    );
    const ascending = url.searchParams.get("order") === "oldest";
    let query = db.from("letters").select("*").eq("status", status);
    if (url.searchParams.get("unread") === "true")
      query = query.is("read_at", null);
    query = query
      .order(status === "draft" ? "updated_at" : "sent_at", { ascending })
      .order("id", { ascending })
      .range(offset, offset + 49);
    const rows = dbResult(await query);
    const counted = await db
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .is("read_at", null);
    dbResult(counted);
    const unreadCount = counted.count || 0;
    return {
      letters: rows.map(presentLetter),
      hasMore: rows.length === 50,
      unreadCount,
    };
  }
  if (req.method === "DELETE") {
    mustAdmin(member);
    const id = uuid.parse(url.searchParams.get("id"));
    const deleted = dbResult(
      await db
        .from("letters")
        .delete()
        .eq("id", id)
        .eq("status", "draft")
        .select("id"),
    );
    if (!deleted.length)
      throw new HttpError(409, "Only an existing draft can be deleted.");
    return { ok: true };
  }
  const body = bodyOf(req);
  if (body.action === "read") {
    const id = uuid.parse(body.id);
    if (member.role === "admin") return { skipped: true };
    dbResult(
      await db
        .from("letters")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "sent")
        .is("read_at", null),
    );
    return { ok: true };
  }
  mustAdmin(member);
  if (body.action === "retry") {
    const id = uuid.parse(body.id);
    const row = dbResult(
      await db
        .from("letters")
        .select("*")
        .eq("id", id)
        .eq("status", "sent")
        .maybeSingle(),
    );
    if (!row) throw new HttpError(404, "Sent letter not found.");
    await notifyLetter(db, id, true);
    return { ok: true };
  }
  const data = letterInput.parse(body);
  if (data.action !== "save" && !data.body.trim())
    throw new HttpError(400, "Write something in the letter body first.");
  const row = dbResult(
    await db.rpc("save_letter", {
      p_id: data.id,
      p_content: data,
      p_version: data.version,
      p_action: data.action,
    }),
  );
  let warning = null;
  if (data.action === "publish") {
    try {
      await notifyLetter(db, row.id);
    } catch {
      warning =
        "Letter sent. Notification status could not be saved; check Sent before retrying.";
    }
    const refreshed = await db
      .from("letters")
      .select("*")
      .eq("id", row.id)
      .maybeSingle();
    if (!refreshed.error && refreshed.data)
      return { letter: presentLetter(refreshed.data), warning };
  }
  return { letter: presentLetter(row), warning };
}
export default endpoint(handleLetters);
