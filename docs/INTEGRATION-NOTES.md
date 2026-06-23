# Teacher Activation Hub Integration Notes

## Detected App Shape

- App type: static HTML/CSS/JavaScript single-page app.
- Entry point: `index.html`.
- Styling: shared CSS in `assets/css/styles.css`.
- Routing pattern: no URL router; feature screens are global functions that call `show(...)` from `assets/js/features/home-students.js`.
- Navigation:
  - Top nav is wired in `assets/js/app.js`.
  - Home tiles are rendered in `assets/js/features/home-students.js`.
- Data layer:
  - Supabase client is initialized in `assets/js/core/database.js`.
  - `DB` abstracts demo mode and Supabase mode.
  - Supabase mode uses browser anon key and RLS-protected tables.
- Auth:
  - Supabase email/password auth in `assets/js/app.js`.
  - `ensureCentre()` sets `CENTRE_ID`.
- Migrations:
  - SQL files live in `supabase/migrations/`.

## Existing Modules To Reuse

- CSV parsing:
  - `readCSVFile`, `csvLine`, and `csvCell` in the shared/core layer.
  - Existing examples:
    - student CSV import in `assets/js/features/home-students.js`
    - certificate participant CSV import in `assets/js/features/certificates.js`
- WhatsApp sending:
  - Existing assisted-manual pattern uses `wa.me` links.
  - Examples:
    - parent reports in `assets/js/features/reports.js`
    - certificates in `assets/js/features/certificates.js`
  - There is no provider API sender or scheduler currently present in this repo.
- Status/UI patterns:
  - Cards, tiles, `listrow`, `pill`, metrics, and CSV tools from `assets/css/styles.css`.
- Supabase access pattern:
  - Add methods to `memoryDB` and `supaDB` in `assets/js/core/database.js`.

## Proposed Mount Point

- Add a home tile: `Teacher Activation`.
- Add a global screen function: `teacherActivation()`.
- Add feature module: `assets/js/features/teacher-activation.js`.
- Register in `index.html` after existing feature scripts.
- Wire function in `assets/js/app.js`.

## Spec Adaptation Needed

The pasted spec mentions server endpoints, service-role operations, webhooks, and `.env.example` values for a framework such as Next.js. This repo is currently a browser-only static app, so:

- Service-role Supabase key must not be added to client-side code.
- Bulk import/send will run with the authenticated user's browser session and RLS policies, not service-role.
- WhatsApp sending in v1 should reuse assisted-manual `wa.me` links.
- Webhook endpoint `POST /api/tah/whatsapp-webhook` is out of reach unless the app is upgraded with a backend, Supabase Edge Function, or external WhatsApp provider callback target.
- Scheduler/automation is not present in the repo. A later phase can add Supabase Edge Functions/Cron or a WhatsApp provider workflow.

## Build Sequence For This Repo

1. Add migration for `tah_*` tables, RLS, triggers, and template seed.
2. Add `DB` methods for teacher activation tables.
3. Add feature module and home tile.
4. Add CSV import for teachers using existing CSV helpers.
5. Add dashboard, teacher table, filters, and status badges.
6. Add template manager and preview.
7. Add assisted-manual send workflow with `wa.me`, `tah_message_logs`, journey-day validation, and STOP line.
8. Add manual reply capture for `YES` / `NOT YET`.
9. Add feedback intake and growth gating.
10. Add README/testing notes.

## Open Inputs Needed

- Full approved D2-D7, rating, referral, testimonial, detractor, and reactivation copy in English and Odia.
- Actual app links:
  - Teachers App link
  - Smart Class App link
  - Feedback form link
  - Rating link
  - Referral base link
- Whether to stay static for v1 or introduce a backend/Supabase Edge Functions for webhooks and scheduled sends.

