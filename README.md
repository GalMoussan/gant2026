# לוח שנה תשפ״ז

Hebrew, right-to-left school-year calendar for מרכז המצוינות האזורי קריית שמונה, from October 2026 through August 2027.

The course schedule is imported from Excel and ships with the app. Events added in the app stay in this browser until Supabase is configured. With Supabase, only an approved account can open the shared board, and a change made on one computer shows up on the others.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually http://127.0.0.1:5173.

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

`npm run test:e2e` installs nothing by itself. The first time, run `npx playwright install chromium`.

## Re-import an updated Excel file

Put the new workbook at `data/schedule.xlsx`. Keep the same sheet layout (legend, holiday list, and the eleven month blocks). Then:

```bash
npm run import
```

The command rewrites `src/data/seed.json` and prints a validation report. It does not change the workbook. If a count does not match the school year the importer expects, the command exits with an error and leaves the previous `seed.json` in place.

Rows that came from Excel cannot be edited in the app. Add a new workbook and run the import again.

## Back up events you added

Open the backup menu in the app bar (the ⋯ button).

- **ייצוא גיבוי (JSON)** downloads the events added on this board.
- **ייבוא גיבוי** merges a file from that export. An event that is already stored with the same id is skipped.

The course schedule is not part of the backup. It comes from `seed.json`.

## Shared board

Leave `.env.local` empty to keep events in this browser and to skip the sign-in page. Copy `.env.example` to `.env.local` and set both variables to turn the shared board on.

`VITE_SUPABASE_ANON_KEY` is the public anon key. It is bundled into the site. Never put the service-role key in `.env.local`, in Vercel, or anywhere in the client.

1. Create a Supabase project in the EU region.
2. In the SQL editor, run `supabase/migrations/20261008120000_events_and_approval.sql`. The matching `*_down.sql` file drops those tables.
3. Authentication → Sign In / Providers → Email: turn off public sign-ups. There is no sign-up or password-reset screen. The calendar admin creates each account and resets a password from the dashboard.
4. Authentication → Users → Add user, with the staff email and a password.
5. Approve that account. The address has to be lowercase:

```sql
insert into public.approved_users (email) values ('name@school.org');
```

6. Project Settings → API: copy the project URL and the anon key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. On Vercel, set those same two variables and redeploy.

A password that is valid but missing from `approved_users` is signed out and cannot open the board. Row Level Security lets an approved session read and change only user-added rows. The email allowlist itself is not readable from the app.

Events already saved in a browser do not move over on their own. Export the JSON backup there, sign in on the shared board, and import it once.

The Excel schedule still changes only through `npm run import` and a new deploy. Those rows are not in the shared table.

Approved browsers receive changes through Supabase Realtime, and the board refetches when a tab becomes visible again. Two edits of the same event: the last save wins. A failed save stays on the form. Edits made offline are not queued.
