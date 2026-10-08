# לוח שנה תשפ״ז

Hebrew, right-to-left school-year calendar for מרכז המצוינות האזורי קריית שמונה, from October 2026 through August 2027.

The course schedule is imported from Excel. Events added in the app stay in this browser (IndexedDB). There is no account and no server.

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

- **ייצוא גיבוי (JSON)** downloads the events added in this browser.
- **ייבוא גיבוי** merges a file from that export. An event that is already stored with the same id is skipped.

The course schedule is not part of the backup. It comes from `seed.json`.
