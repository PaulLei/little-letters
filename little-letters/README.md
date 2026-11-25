# Little Letters

A private mailbox for one writer and one reader. Adapted from the code you supplied, with the cream stationery, animated envelope, archive, and writing desk preserved.

**Start with [START_HERE.md](START_HERE.md).** It explains how to put this project on GitHub, host it on Vercel, and add it to an iPhone Home Screen.

| Part                       | Service                                      |
| -------------------------- | -------------------------------------------- |
| Source code                | Your GitHub repository                       |
| Website and private API    | Vercel                                       |
| Letters and login accounts | Supabase                                     |
| Phone notifications        | Standard Web Push, using your own VAPID keys |

There is no Base44 SDK, hosting, login, email service, asset URL, or runtime dependency. The fonts and icons are served with this app. Private letters are stored in Supabase, never in the GitHub repository.

## Included

- One private mailbox, limited to one administrator and one reader.
- Animated envelope, unread status, paper letters, and a paginated archive.
- Writing desk with autosave, formatting, stationery selection, and live preview.
- Separate sent-letter corrections that preserve the send timestamp.
- Real web-push subscription and sending code, with generic notification content.
- Home Screen manifest, local app icons, and an offline connection page.
- Database schema, row-level access rules, atomic publishing, and conflict checks.
- Vercel API functions, local development server, tests, and GitHub Actions.

## Local development

Use Node.js 24 LTS (or Node.js 22.12+).

```sh
npm ci
```

Copy `.env.example` to `.env.local`, fill in the values from your own Supabase project, then:

```sh
npm run dev
```

This runs Vite and a local version of the API. `npm run dev:ui` and `npm run preview` run only the interface, so their API calls need the separate backend. A build without public environment variables displays a setup screen; configure the variables and rebuild before sharing it.

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:ui
```

The unit/database tests run PostgreSQL in PGlite with simulated Supabase auth roles. The browser tests use mock API responses, so they need no live credentials. See [VERIFICATION.md](VERIFICATION.md) for the exact scope of testing.

## How the private API works

The browser signs in through Supabase Auth and sends its access token to the Vercel API. Each request verifies that token and checks the database membership table. Only the administrator can save, publish, delete drafts, or retry notifications. Reader actions cannot change content. No role is accepted from browser input or editable user metadata.

SQL permissions also block direct client writes. Uninvited accounts see no letters; the reader sees sent letters only. The server's Supabase secret stays in Vercel environment variables. Database operations run with that server credential only after authorization.

Each draft has a stable UUID. Client saves are serialized, and database writes use a transaction lock plus a version check. A retried publish returns the same sent letter without changing its contents. A new composition gets a new UUID. A delayed draft save cannot overwrite a sent letter.

## Push behavior and limits

Publishing saves the letter before attempting a notification. A notification failure never rolls back the letter. Check **Writing desk → Sent** for status and a retry button. A request interrupted during sending can be retried after the two-minute lease expires.

“Push accepted” means a push service accepted the request. It does not prove that a phone displayed it. Focus modes, permission settings, connectivity, and the operating system affect display. If some devices accept and others fail, the status reports the accepted count; it does not automatically resend to successful devices. Exactly-once delivery across an external push service cannot be guaranteed after a server crash. A stable notification tag reduces duplicate visible notifications.

This project uses request-driven notification attempts, not a scheduled delivery queue. Keep the same VAPID keys and production URL when redeploying. Replacing the keys or domain requires the reader to subscribe again. No Apple Developer Program membership is needed for web push.

## What is not migrated automatically

This project contains the app code you supplied, adapted for independent hosting. Your existing Base44 database records and accounts were not supplied and are not included. If you already have real letters there, export them separately and arrange a data import before deleting the old app. The new login accounts are created in Supabase.

## Useful source files

| File or folder                    | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `src/components/Envelope.jsx`     | Envelope animation                               |
| `src/components/LetterPaper.jsx`  | Paper and stationery                             |
| `src/components/LetterEditor.jsx` | Writing and preview                              |
| `src/lib/DraftSession.js`         | Save/send sequencing                             |
| `src/pages/`                      | Mailbox, archive, reader, settings, writing desk |
| `api/`                            | Vercel HTTP endpoints                            |
| `server/`                         | Authorization, validation, web-push sending      |
| `supabase/schema.sql`             | Tables, permissions, transactional functions     |
| `public/sw.js`                    | Background notifications and offline page        |
| `vercel.json`                     | Hosting, API, and deep-link configuration        |

## References

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Apple web push requirements](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [Web Push library](https://github.com/web-push-libs/web-push)
