# Put Little Letters on your iPhone

You now have a standalone project. No Base44 subscription is needed.

You need accounts at **GitHub**, **Vercel**, and **Supabase**. GitHub stores the code. Vercel runs the website and API. Supabase keeps the private letters and the two login accounts.

This download has not been connected to your accounts or deployed. Follow the steps below in order.

## 1. Create the database

1. Go to [Supabase](https://supabase.com/dashboard) and create a new project. Keep its database password somewhere safe.
2. Open **SQL Editor**.
3. Open `supabase/schema.sql` from this download, copy the entire file, and run it in the SQL Editor. Run it once in the new project.
4. Go to **Authentication → Users**. Use **Add user / Create user** to create an account for yourself and one for the recipient. Set a password for each and enable **Auto Confirm User** if offered. This project uses password login, not invitation links.
5. In the authentication settings, turn off new public user signups. The app also has a database allowlist, so an account without membership cannot access your mailbox.
6. Open `supabase/members.example.sql`. Replace `YOUR_EMAIL@example.com` and `READER_EMAIL@example.com` with the two real addresses you just used. Run the edited SQL in the SQL Editor.
7. Check that the result shows exactly two rows: one `admin` and one `reader`.

Do not run the example with unchanged addresses. No membership rows will be added for addresses that do not exist.

## 2. Put the code in GitHub

1. Extract `little-letters.zip`.
2. Go to [GitHub → New repository](https://github.com/new).
3. Name it `little-letters` and choose **Private**.
4. Create the repository. Select **uploading an existing file**, or **Add file → Upload files**.
5. Upload the **contents of the extracted `little-letters` folder**, preserving its subfolders. `package.json`, `vercel.json`, `src`, `api`, and `supabase` should be at the repository root. Upload the extracted files, not the ZIP itself.
6. Include `.gitignore`, `.env.example`, and `.github/workflows/check.yml`. If your file picker hides these, enable hidden files or use GitHub Desktop.
7. Commit the upload.

Never upload `.env.local`, `.env.push.local`, passwords, or secret keys. The included `.gitignore` excludes them when using Git or GitHub Desktop. Do not upload `node_modules`, test screenshots, or `dist`.

## 3. Generate the notification keys

Install [Node.js 24 LTS](https://nodejs.org/) if needed. Open a terminal in the extracted project folder and run:

```sh
npm ci
npm run push:keys
```

The second command creates a private local file named `.env.push.local`. Open it in a text editor. It contains the notification keys for the next step. Change the example email in `VAPID_SUBJECT` to your real contact email, keeping the `mailto:` prefix.

Keep this file privately. Do not regenerate the keys for each deployment. The command refuses to overwrite an existing key file.

If you want to get the mailbox running first, you can leave the push variables blank initially and complete this step later. Sending letters will still work, with notification status showing that push is not configured.

## 4. Connect GitHub to Vercel

1. Go to [Vercel → New project](https://vercel.com/new).
2. Connect GitHub and import your private `little-letters` repository.
3. Use the **Vite** framework preset.
4. Leave the root directory at the repository root. Build command: `npm run build`. Output directory: `dist`.
5. Before deploying, add the environment variables below. Use the production environment. If you enable preview deployments, use a separate test database for them.

| Variable                        | Value                                             | Where it runs |
| ------------------------------- | ------------------------------------------------- | ------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL                         | Browser       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, or legacy `anon` key    | Browser       |
| `SUPABASE_URL`                  | The same Supabase project URL                     | Server        |
| `SUPABASE_SECRET_KEY`           | Supabase secret key, or legacy `service_role` key | Server only   |
| `VITE_VAPID_PUBLIC_KEY`         | From `.env.push.local`                            | Browser       |
| `VAPID_PUBLIC_KEY`              | The same public key                               | Server        |
| `VAPID_PRIVATE_KEY`             | From `.env.push.local`                            | Server only   |
| `VAPID_SUBJECT`                 | `mailto:your-real-email@example.com`              | Server        |

Find Supabase's URL and keys in your project settings/API keys or Connect dialog. The publishable/anon key is meant for the browser. The secret/service-role key is not. **Never name the secret key with a `VITE_` prefix.**

6. Click **Deploy**. Vercel reads the included configuration for the API and page routes.
7. In Supabase's authentication URL configuration, set **Site URL** to your production Vercel URL, such as `https://your-project.vercel.app`.
8. Open that production URL and sign in with your administrator account.
9. Open **Settings → Open the writing desk** to write your first letter.

If you change any `VITE_` variable after deployment, redeploy: those values are built into the browser files. Keep your production URL stable so the installed app and its push subscriptions continue to use the same origin.

## 5. Add it to the recipient's iPhone

1. Open the production Vercel link in **Safari**.
2. Tap **Share → Add to Home Screen**. Depending on iOS, you may need to scroll through the Share menu. If shown, keep **Open as Web App** enabled.
3. Open Little Letters using the new envelope icon.
4. Sign in with the recipient's account. You may need to sign in again even if you already signed in within Safari.
5. Open **Settings → Enable notifications** and tap **Allow** on the phone's prompt.

iPhone web push requires iOS 16.4 or newer and opening the installed Home Screen app. The recipient can still use the mailbox without enabling notifications. A native App Store app is not required.

## 6. Test the complete flow

1. Leave the recipient's app and lock their phone.
2. On your own device, write a test letter and press **Send Letter**.
3. Check the phone for **You got mail!**
4. Tap the notification. It should open the matching letter after login if needed.
5. Return to the mailbox and confirm that the unread count changed.
6. Open Archive and verify that the letter stays there.
7. Send a second letter and make sure the first one stays unchanged.

If the notification does not appear, check **Writing desk → Sent** for its status. Also check notification permission and Focus/Do Not Disturb on the phone. “Push accepted” is not a guarantee that iOS displayed it. Re-enable notifications on the reader's device if you changed the keys or domain.

## Fix common setup problems

| Problem                                | What to check                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| “Your mailbox is ready for setup”      | Add the two `VITE_SUPABASE_*` values in Vercel, then redeploy.                                                      |
| Login works but access is denied       | The signed-in user's ID must be in the Supabase `members` table.                                                    |
| API says mailbox is not configured     | Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to Vercel.                                                             |
| Database/API errors                    | Run the complete schema in the correct project; confirm URL and keys belong to that project.                        |
| Login fails                            | Check that the account was created and confirmed in Supabase Authentication. Password changes can be managed there. |
| Direct letter link fails               | Ensure `vercel.json` is at the repository root and the deployment uses Vite.                                        |
| No “Enable notifications”              | Open from the iPhone Home Screen, use a supported iOS version, and configure all VAPID variables.                   |
| A letter stays “Sending notification…” | Wait two minutes, then retry from Sent. The lease prevents overlapping attempts.                                    |
| Autosave reports a conflict            | Another tab changed the letter. Copy your unsaved words somewhere safe, reload, then make the intended correction.  |

## Updating later

Commit code changes to GitHub. Vercel can rebuild the connected project automatically. Letters remain in Supabase. Keep the same project, database, domain, and VAPID keys.

Keep occasional backups of the Supabase letter data. GitHub is a code backup, not a backup of your letters. Existing Base44 letter records are not part of this download and need a separate import if you have any to keep.
