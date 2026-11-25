import { createServer as createHttpServer } from "node:http";
import { createServer as createViteServer } from "vite";
import session from "../api/session.js";
import letters from "../api/letters.js";
import push from "../api/push.js";
const handlers = {
  "/api/session": session,
  "/api/letters": letters,
  "/api/push": push,
};
const api = createHttpServer(async (req, res) => {
  const handler = handlers[new URL(req.url, "http://localhost").pathname];
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  if (!handler) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 150000) {
        res.status(413).json({ error: "Request too large" });
        return;
      }
    }
    req.body = body ? JSON.parse(body) : undefined;
    await handler(req, res);
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});
api.listen(3001, "127.0.0.1");
const vite = await createViteServer();
await vite.listen();
vite.printUrls();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    api.close();
    await vite.close();
    process.exit(0);
  });
