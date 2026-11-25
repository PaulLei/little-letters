import { test, expect } from "@playwright/test";
const adminId = "10000000-0000-4000-8000-000000000001";
const readerId = "10000000-0000-4000-8000-000000000002";
const firstId = "20000000-0000-4000-8000-000000000001";
const secondId = "20000000-0000-4000-8000-000000000002";
async function setup(page, role = "reader") {
  const user = {
    id: role === "admin" ? adminId : readerId,
    email: `${role}@example.com`,
    aud: "authenticated",
    app_metadata: { provider: "email" },
    user_metadata: {},
  };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.testing`;
  await page.addInitScript(
    ({ user, token }) =>
      localStorage.setItem(
        "sb-test-mailbox-auth-token",
        JSON.stringify({
          access_token: token,
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        }),
      ),
    { user, token },
  );
  await page.route("https://test-mailbox.supabase.co/**", (route) =>
    route.fulfill({ json: user }),
  );
  const sample = {
    title: "A small Tuesday",
    greeting: "My dearest,",
    body: "I saw something today that made me think of you.\n\nThe light was coming through the kitchen window, and for a moment everything felt still.\n\nI hope there is a little quiet in your day, too. **You are loved.**",
    signature: "Yours, always",
    stationeryStyle: "cream",
    status: "sent",
    version: 1,
    notificationStatus: "accepted",
    notificationNote: "Push accepted.",
    updatedAt: "2026-11-24T19:42:00Z",
    readAt: null,
  };
  const state = {
    letters: [
      { ...sample, id: firstId, sentAt: "2026-11-24T19:42:00Z" },
      {
        ...sample,
        title: "One more little thing",
        id: secondId,
        sentAt: "2026-11-25T19:42:00Z",
      },
    ],
    published: [],
    read: [],
  };
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname === "/api/session")
      return route.fulfill({
        json: {
          user: { ...user, role },
          pushConfigured: false,
          readerConfigured: true,
        },
      });
    if (url.pathname !== "/api/letters")
      return route.fulfill({ json: { ok: true } });
    if (req.method() === "GET") {
      if (url.searchParams.has("id"))
        return route.fulfill({
          json: {
            letter: state.letters.find(
              (l) => l.id === url.searchParams.get("id"),
            ),
          },
        });
      let list = state.letters.filter(
        (l) => l.status === (url.searchParams.get("status") || "sent"),
      );
      if (url.searchParams.get("unread") === "true")
        list = list.filter((l) => !l.readAt);
      list.sort(
        (a, b) =>
          (url.searchParams.get("order") === "oldest" ? 1 : -1) *
          (a.sentAt || a.updatedAt).localeCompare(b.sentAt || b.updatedAt),
      );
      return route.fulfill({
        json: {
          letters: list,
          hasMore: false,
          unreadCount: state.letters.filter(
            (l) => l.status === "sent" && !l.readAt,
          ).length,
        },
      });
    }
    if (req.method() === "DELETE") {
      state.letters = state.letters.filter(
        (l) => l.id !== url.searchParams.get("id"),
      );
      return route.fulfill({ json: { ok: true } });
    }
    const body = req.postDataJSON();
    if (body.action === "read") {
      state.read.push(body.id);
      const target = state.letters.find((l) => l.id === body.id);
      if (target) target.readAt = new Date().toISOString();
      return route.fulfill({ json: { ok: true } });
    }
    const target = state.letters.find((l) => l.id === body.id),
      saved = {
        ...target,
        ...body,
        status:
          body.action === "publish" || target?.status === "sent"
            ? "sent"
            : "draft",
        version: (target?.version || 0) + 1,
        updatedAt: new Date().toISOString(),
        sentAt:
          target?.sentAt ||
          (body.action === "publish" ? new Date().toISOString() : null),
        notificationStatus: "unavailable",
        notificationNote: "No device enabled.",
      };
    state.letters = state.letters.filter((l) => l.id !== saved.id);
    state.letters.push(saved);
    if (body.action === "publish") state.published.push(saved);
    return route.fulfill({ json: { letter: saved } });
  });
  return state;
}
test("reader opens oldest unread, reads next, and sees archive on an iPhone-sized screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setup(page);
  await page.goto("/");
  await expect(page.getByText("You have mail!", { exact: true })).toBeVisible();
  await expect(page.getByText("2 letters waiting")).toBeVisible();
  await page.screenshot({ path: "test-results/mailbox-mobile.png" });
  await page
    .getByRole("button", { name: "Open your oldest unread letter" })
    .click();
  await expect(page).toHaveURL(new RegExp(firstId));
  await expect(page.getByText("My dearest,")).toBeVisible();
  await expect.poll(() => state.read.includes(firstId)).toBeTruthy();
  await page.screenshot({
    path: "test-results/letter-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Open next letter" }).click();
  await expect(page).toHaveURL(new RegExp(secondId));
  await expect.poll(() => state.read.includes(secondId)).toBeTruthy();
  await page.getByRole("link", { name: "All letters in the archive" }).click();
  await expect(page.getByRole("heading", { name: "Archive" })).toBeVisible();
  await expect(page.getByText("A small Tuesday")).toBeVisible();
  await page.goto("/write");
  await expect(
    page.getByText(
      "This is the writing desk — only the letter writer can be here.",
    ),
  ).toBeVisible();
});
test("writer sends two different letters without overwriting the first", async ({
  page,
}) => {
  const state = await setup(page, "admin");
  await page.goto("/write");
  await page.getByLabel("Title (optional)").fill("First new letter");
  await page
    .getByLabel("Letter", { exact: true })
    .fill("Words in the first letter");
  await page.getByRole("button", { name: "Send Letter", exact: true }).click();
  await expect(page.getByText(/Letter sent\./)).toBeVisible();
  await page.getByLabel("Title (optional)").fill("Second new letter");
  await page
    .getByLabel("Letter", { exact: true })
    .fill("Words in the second letter");
  await page.getByRole("button", { name: "Send Letter", exact: true }).click();
  await expect.poll(() => state.published.length).toBe(2);
  expect(state.published[0].id).not.toBe(state.published[1].id);
  expect(state.letters.find((l) => l.id === state.published[0].id).body).toBe(
    "Words in the first letter",
  );
  await page.goto(`/letters/${firstId}`);
  await expect(page.getByText("Preview — read state unchanged")).toBeVisible();
  expect(state.read).toHaveLength(0);
});
test("mobile editor has working preview, formatting, and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, "admin");
  await page.goto("/write");
  await page.getByLabel("Greeting (optional)").fill("Hello, you");
  await page
    .getByLabel("Letter", { exact: true })
    .fill("A little note for today.");
  await page.getByRole("button", { name: "Sage tint" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Preview", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.locator("article").getByText("Hello, you")).toBeVisible();
  await expect(page.locator("article").getByText("Not sent yet")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("network errors are visible rather than disguised as an empty mailbox", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/letters**", (route) =>
    route.fulfill({ status: 503, json: { error: "Connection unavailable" } }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Connection unavailable");
  await expect(
    page.getByText("Your first letter will arrive here."),
  ).toHaveCount(0);
});
