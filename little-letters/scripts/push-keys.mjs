import * as webpush from "web-push";
import { writeFileSync } from "node:fs";
const keys = webpush.generateVAPIDKeys();
// This file is ignored by git. Refuse to overwrite a previous key pair.
writeFileSync(
  ".env.push.local",
  `VITE_VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=mailto:you@example.com\n`,
  { flag: "wx", mode: 0o600 },
);
console.log(
  "Created .env.push.local. Copy its values into Vercel environment variables. Keep the private key secret; keep this same key pair for future deployments.",
);
