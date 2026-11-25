# Verification

This project has been checked locally. It has not been deployed to your accounts.

## Completed

- Production Vite build: passed.
- Automated API, database, draft sequencing, and service-worker tests: 21 passed.
- Chromium browser tests: 4 passed.
- Mobile mailbox and letter screenshots reviewed at a 390-pixel viewport.

The API tests cover authentication and role checks. The database tests run the included SQL in PGlite with simulated Supabase auth roles. They check private draft access, restricted writes, publish retries, preserved send times, version conflicts, and notification leases. Draft-session tests check save/send ordering and separate IDs for successive letters.

The browser tests use mocked API responses. They cover the reader's mailbox, letter navigation, archive, writer access, two successive sends, mobile preview and stationery selection, and visible connection errors. They do not use a live Supabase project. Service-worker tests exercise notification behavior separately; the browser tests do not use a real push service.

## Still needs your deployed app and phone

- Supabase account creation, keys, and membership setup.
- Vercel environment variables, deployment, and production API access.
- Real iPhone Home Screen installation and notification permission.
- A complete send-to-locked-phone notification test.
- Import of any existing Base44 letters, if needed.

Follow the complete-flow check in `START_HERE.md` after deployment. A passing local test does not establish that an external account is configured correctly or that iOS displayed a push notification.

## Run the checks again

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:ui
```

These tests require no real account credentials. Never place production secrets in the test files or GitHub repository.
