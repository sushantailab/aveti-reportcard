# Local development & safe releases — a guide for running this as a real product

Status: current reality, for the live app (`index.html` + `assets/`) deployed via GitHub
Pages. Not about `apps/web` (the Next.js rebuild) — that app has its own, separate
workflow once it goes to Vercel (see `ARCHITECTURE.md` §6, which describes that
future state, not today's).

Written because: you now have real schools and students depending on this app, and
you asked — correctly — how a solo technical founder should develop, test, and
release changes without risking the people already using it. This is the same
discipline a 15-year engineering lead would set up for a one-person shop: not
enterprise process for its own sake, just the minimum that keeps you from breaking
things for real users.

---

## 1. Three different places, three different jobs

Confusion about "local" vs "GitHub" vs "production" is the root of most of your
questions below, so pin this down first:

| Place | What it is | Can it break things for real users? |
|---|---|---|
| **Your laptop** | A disposable workspace. Nothing here is safe until it's pushed. | No — nobody else can see it. |
| **GitHub, any branch except `main`** | Your real backup. Pushing here is how you don't lose work. | No — pushing to a branch does not deploy anything. |
| **GitHub, `main` branch** | The trigger. Every push to `main` auto-builds and auto-deploys. | **Yes, within about a minute.** |
| **Supabase database** | Shared by the live app right now. (See §4 — this needs to change.) | **Yes, immediately — it's the same data your schools see.** |

The one-sentence version: **pushing to GitHub is always safe; merging to `main` is
the only unsafe moment.** You can push to a branch as often as you like — every five
minutes, half-finished, broken — and the live site never changes.

## 2. "Is keeping code only on my machine the right way?" — No

Your laptop is not a backup. If you lose it, anything you haven't pushed to GitHub
is gone — not "hard to recover," genuinely gone, because GitHub holds the only other
copy.

The fix is simple and costs nothing: **commit and push to a branch often**, even
when a change is half-done. A branch (like the one this work is already on,
`claude/dreamy-babbage-vi5cip`) is just storage with history — it does not go live
until you merge it into `main`. So "push often, merge rarely" is the whole rule:

- Lose your laptop today → everything on GitHub (any branch) is safe. Clone the repo
  on a new machine, `git checkout` your branch, and you're exactly where you left off.
- Only at risk: changes made since your last `git push`. The fix for that risk is
  pushing more often, not pushing less.

## 3. Setting up your machine for local development

One-time setup:

```bash
git clone https://github.com/sushantailab/aveti-reportcard.git
cd aveti-reportcard
npm install          # only needed for the build/minify step, not to just view the app
```

You'll need Node.js installed (any recent version) and `git`. Nothing else — this is
a static site, not a server application.

## 4. The one gap that matters most: a separate database for testing

Right now, **there is only one Supabase database, and it is production** — the same
one real schools' marks live in. If you ran the app on your laptop today exactly as
it is, "local testing" would mean typing into the live database. That's the opposite
of safe, and it's the first thing to fix before the rest of this guide is trustworthy.

**The fix (free, ~10 minutes): create a second Supabase project as your sandbox.**

1. In Supabase, create a new project — call it something like `aveti-reportcard-dev`.
   Free tier is fine for development.
2. Run every file in `supabase/migrations/` against it, in filename order, so it has
   the same tables and security rules as production (empty of real data, which is
   the point — it's safe to break).
3. On your laptop, copy `assets/js/config.js` to `assets/js/config.local.js` (already
   covered by `.gitignore` patterns for local-only files — if not, add it) and point
   `SUPABASE_URL` / `SUPABASE_ANON_KEY` at the **dev** project, not production.
   Never commit real production keys changes here — keep your dev config local only.
4. Add a few fake students/tests to the dev project so you have something to look at.

Once this exists, nothing you do on your laptop can ever touch a real school's data,
no matter what you break. This is worth doing before anything else in this guide.

*(This was already flagged as open work in `ARCHITECTURE.md` §7, item 3 — this is
that item, made concrete.)*

## 5. Running the app locally

This is a static site (no server-side code), so "running it" means serving the files
and opening them in a browser — not double-clicking `index.html` directly, which
breaks on some browsers due to `file://` restrictions on network requests.

```bash
# from the repo root, after pointing config at your dev database (§4)
python3 -m http.server 8080
# then open http://localhost:8080/ in a browser
```

Any simple static-file server works the same way (`npx serve`, VS Code's "Live
Server" extension, etc.) — the exact tool doesn't matter, only that it's an HTTP
server, not a bare file.

To preview the production build (minified, combined scripts — closer to what GitHub
Pages actually serves):

```bash
npm run build          # writes dist/
python3 -m http.server 8080 --directory dist
```

## 6. The full workflow, start to finish

```
1. git checkout -b fix/whatever-you-are-changing
2. Edit files locally.
3. Test locally against the DEV database (§4/§5) — click through the actual
   screens you changed, not just "it looks right in the code."
4. git add, git commit, git push -u origin fix/whatever-you-are-changing
   -> safe at this point, GitHub has it, production is untouched.
5. Open a Pull Request on GitHub (or keep pushing to the branch while you
   keep testing — no rush).
6. When you're confident: merge the PR into main.
7. GitHub Actions builds and deploys automatically, live within ~1 minute.
```

Steps 1–5 can happen at any time of day, as many times as you like, with zero risk.
**Step 6 is the only moment that matters.**

## 7. The pre-flight checklist — what to verify before merging to `main`

Treat this like a pilot's checklist: boring, short, and done every single time,
exactly because skipping it is when mistakes happen.

**Code**
- [ ] `npm run build` completes with no errors.
- [ ] You tested the actual changed screen(s) locally — clicked the buttons, not just
      read the code.
- [ ] No red errors in the browser's console (right-click → Inspect → Console) on
      the screens you touched.

**Database** (only if the change includes a `supabase/migrations/*.sql` file)
- [ ] The migration was run against the **dev** project first (§4) and didn't error.
- [ ] You did not edit a migration file that's already been applied to production —
      write a new one instead (this is a hard rule; see `ARCHITECTURE.md` §8).
- [ ] If the migration changes a table real data already lives in, you checked what
      happens to existing rows (a new column needs a safe default; a renamed column
      needs the app code updated in the same change).

**UI / data**
- [ ] Checked on a phone-sized browser window, not just desktop — most teachers use
      this on a phone.
- [ ] If you changed anything a teacher or parent sees (reports, WhatsApp messages,
      marks entry), looked at it with real-looking data, not just one test row.

**Timing**
- [ ] Merge when the tuition centre isn't actively using the app — late evening or
      early morning IST is safest, not the middle of a school day.

**If something goes wrong after merging**
- `git revert <commit>` on `main` and push — this undoes the change and redeploys
  the previous working version within a minute, same mechanism as any other push.
- A database migration can't be "un-pushed" the same way — this is exactly why §4
  (test migrations on a dev copy first) matters more than any other item here.

## 8. What this buys you, and what it doesn't

This workflow protects against the common, costly mistakes: shipping something
untested, losing work because it only existed on one laptop, or a schema change
corrupting live data. It will not catch everything a dedicated QA process would —
for a one-person shop at your current scale, that's the right trade-off. Revisit
this (automated tests, a staging environment, CI checks) once you have a second
developer or enough paying centres that an outage has real cost — not before, since
process that outruns the team size just slows you down for no safety benefit yet.
