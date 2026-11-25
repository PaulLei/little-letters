import { endpoint, dbResult, HttpError } from "../server/core.js";
import { pushConfigured } from "../server/notifications.js";
export default endpoint(async (req, { db, user, member }) => {
  if (req.method !== "GET") throw new HttpError(405, "Method not allowed.");
  const reader =
    member.role === "admin"
      ? dbResult(
          await db
            .from("members")
            .select("user_id")
            .eq("role", "reader")
            .maybeSingle(),
        )
      : null;
  return {
    user: { id: user.id, email: user.email, role: member.role },
    pushConfigured: pushConfigured(),
    readerConfigured: member.role === "reader" || Boolean(reader),
  };
});
