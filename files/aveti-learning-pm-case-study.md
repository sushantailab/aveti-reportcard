# Aveti Learning — turning lost exam data into transparency for teachers, parents and owners
### A product case study · chapter-end-test reporting for tuition centres

*Working product name: Aveti Learning (placeholder — rename freely).*
*Author role in this case study: Product Manager (problem owner + builder of the POC).*
*Context: built as an end-to-end portfolio project, piloted in a real multi-teacher tuition centre.*

---

## 0. How to read this
This is the story of a product from a vague frustration ("we keep losing exam data") to a working
proof-of-concept that delivers report cards to parents. It is deliberately written as a PM would
think — problem first, users second, solution third — not as a feature list. The build (designs,
spec, schema, deployment) is the *output* of this thinking and lives in the appendix.

---

## 1. Executive summary (TL;DR)
Tuition centres run frequent chapter-end tests but capture the results on paper. The marks are
recorded once, used to read out a rank, and then effectively lost. Nobody can see how a student is
trending, parents get only a verbal "he's doing fine," and the owner has no view of which classes or
teachers are actually delivering results.

Aveti Learning closes that loop: a teacher enters a test's marks in under three minutes, and the system
instantly produces three reports from the same data — a class report for the teacher, a branded card
for each parent (shareable on WhatsApp), and a chapter-to-chapter growth view (class and individual).
Over time the same data also reveals the teacher's own journey — which is the deeper transparency the
centre owner has never had.

The core bet: **the value isn't in storing marks, it's in making them visible — fast, automatically,
to the right person.**

---

## 2. The PM process I followed
I worked through a standard discovery-to-delivery arc and used recognised frameworks at each step,
not for show but because each earns its place:

| Stage | What I did | Framework used |
|---|---|---|
| Discover | Found and validated the real problem at my own centre | Double Diamond (Discover), 5 Whys |
| Define | Framed the problem, the users, and what success means | Jobs-to-be-Done, North Star / HEART |
| Ideate | Mapped opportunities to solutions, chose the smallest valuable slice | Opportunity Solution Tree |
| Prioritise | Sequenced features against effort and impact | RICE, MoSCoW |
| Design | Turned requirements into screens and flows | User journeys, lo-fi → hi-fi mockups |
| Deliver | Defined the MVP, roadmap and rollout | Now / Next / Later, phased GTM |
| Measure | Decided how I'd know it worked | Input vs output metrics, guardrails |

The discipline I'm demonstrating: I did not start at "let's build a report screen." I started at
"what is broken, for whom, and how often," and let that decide what to build.

---

## 3. Discovery

### 3.1 The trigger
At my tuition centre, multiple teachers run multiple classes and conduct chapter-end tests (CETs)
regularly. After each test the marks were written in a register or on loose answer sheets, a rank was
announced, and the paper was filed or thrown away. The trigger insight came when a parent asked
"is my child improving?" and no one could answer — the data to answer it had existed, and was gone.

### 3.2 Problem statement
> Chapter-test data is captured but never converted into insight. It is lost or trapped on paper,
> so students can't see their trajectory, parents have no transparent view of progress, and the
> centre owner is blind to how classes and teachers are performing over time.

This is a *data-to-decision* gap, not a data-capture gap. The marks exist for a moment; the system
to retain, compute and communicate them does not.

### 3.3 How I validated it (research approach)
Because I run the centre, discovery was primary, not theoretical:
- **Teacher interviews** — how they record marks today, what they do after a test, what they dread.
- **Observation** — watched the post-test routine (register entry, verbal rank, filing).
- **Data audit** — tried to reconstruct one student's term from existing records. Couldn't. That
  failure *was* the evidence.
- **Parent conversations** — what parents actually want to know, and how (answer: simply, on WhatsApp).

### 3.4 Key findings
1. The marks loop dies at "announce the rank." Nothing downstream exists.
2. Teachers won't adopt anything slow — entry must take minutes, not a session.
3. Parents don't want a portal/login; they want a clear message where they already are (WhatsApp).
4. The owner's biggest blind spot isn't student-level — it's *teacher- and class-level* performance.
5. Comparability is fragile: tests are out of 20 or 25, so raw marks mislead; only percentage travels.

### 3.5 Root-cause framing (5 Whys, condensed)
Data is lost → because it's never digitised → because digitising felt like extra work for teachers →
because no tool fit a 3-minute post-test window → because existing report systems are built for
schools/exams, not lightweight chapter tests in a tuition setting. **So the wedge is speed of capture
plus automatic output — not another heavy gradebook.**

---

## 4. Users & personas
Four stakeholders, distinct jobs. The product serves one writer (teacher) and three readers.

**Teacher — primary user ("Swadhanjali")**
- JTBD: *When I finish marking a test, I want to record results in minutes and have parents informed,
  so I look professional without extra admin.*
- Pains: paper entry, repeating results to parents, no record of her own track record.
- Gains: speed, recognition (her class trend is visible), one-tap parent updates.

**Centre owner / admin — the buyer ("me / Sushant")**
- JTBD: *When I run a multi-teacher centre, I want to see how each class and teacher is performing
  over time, so I can coach teachers and prove value to parents.*
- Pains: zero visibility into teacher effectiveness; parent trust rests on word of mouth.
- Gains: transparency across teachers and classes; a credibility tool for admissions/retention.

**Parent — the audience that decides renewal**
- JTBD: *When my child takes a test, I want to know how they did and whether they're improving,
  simply and where I already am.*
- Pains: vague verbal updates; no sense of trajectory or standing.
- Gains: a clear branded card on WhatsApp, with rank and trend, in their language.

**Student — the subject**
- JTBD: *I want to know where I stand and whether I'm getting better.*
- Gains: concrete feedback and a visible growth line.

> Strategic note: parents *experience* the value, teachers *create* it, and the owner *buys* it.
> A good design keeps all three happy — which is why the parent card is the hook, teacher speed is
> the adoption lever, and owner analytics is the retention/expansion driver.

---

## 5. Current vs future journey

**Today:** Test conducted → marks on paper → rank read out → paper filed/lost → parent told "fine" →
owner sees nothing → next chapter, no memory of the last.

**With Aveti Learning:** Test conducted → teacher enters marks in ~3 min → three reports auto-generated →
parent gets a card on WhatsApp → owner sees class & teacher trends → every chapter compounds into a
growth history.

The shift is from a *one-time, verbal, lossy* event to a *persistent, visual, shared* record.

---

## 6. Opportunity → solution map
From the problem, the opportunity tree branches into three outcomes, each with a solution:

- Outcome: *teachers capture data effortlessly* → Solution: fast marks-entry form (3-min, 20/25 toggle, absent handling).
- Outcome: *parents see progress transparently* → Solution: auto-generated branded card + bulk WhatsApp share.
- Outcome: *owner sees teacher/class journey* → Solution: growth tracker + (later) teacher analytics.

I deliberately did **not** branch into homework, fees, attendance or messaging — see non-goals. The
discipline of a tight opportunity tree is what keeps an MVP an MVP.

---

## 7. Goals & success metrics

**North Star metric:** *% of conducted chapter tests that reach parents as a report within 48 hours.*
This single number encodes the entire thesis: data captured (not lost) + report generated +
transparency delivered + delivered in time to matter.

| Type | Metric | Why it matters |
|---|---|---|
| Input | Active teachers entering marks per week | Adoption of the capture habit |
| Input | Median time to enter one test | The 3-minute promise; the adoption lever |
| Output | Parent cards delivered per active class / month | Transparency actually reaching parents |
| Outcome | Parent engagement (card opened / replied) | Is the audience receiving value |
| Outcome | Chapters tested & reported per class per term | Coverage / habit strength |
| Guardrail | Report accuracy (data-entry error rate, correct absentee handling) | A wrong average destroys trust instantly |
| Guardrail | Teacher time per test stays under target | If it gets slow, adoption dies |

Long-horizon outcome (a hypothesis to test, not an MVP metric): chapter-over-chapter score
improvement and teacher consistency become visible and coachable.

---

## 8. PRD (product requirements)

### 8.1 Problem
(See §3.2.) Chapter-test data is lost; no transparency for students, parents or owner.

### 8.2 Goals
- A teacher can record a test and inform parents in minutes, with no separate "generate" step.
- Each reader gets a report fit for them; parents receive theirs on WhatsApp.
- Marks accumulate into a chapter-to-chapter growth history (class and individual).

### 8.3 Non-goals (explicitly out of scope for the POC)
- Not a full school ERP, attendance, fee or homework system.
- Not a parent login/portal — delivery is push (WhatsApp), not pull.
- Not a question-level analytics or item-bank engine.
- Not multi-centre SaaS yet — single centre first.
Stating non-goals is as important as goals; it's what makes the MVP shippable.

### 8.4 User stories (MoSCoW)
**Must**
- As a teacher, I can set up a test (class, section, subject, chapter, type, full marks 20/25, date).
- As a teacher, I can enter each student's marks or mark them absent, with a live average.
- As a teacher, on save, the class report, parent cards and growth view exist automatically.
- As a teacher, I can print/share the class report and send parent cards.
- As a parent, I receive only my child's card — never the class list.
**Should**
- As a teacher/owner, I can see a chapter-to-chapter growth line (class trend and individual).
- As a teacher, I can edit the auto-generated note before sending.
- As an owner, I can log in and see only my centre's data.
**Could**
- Parent cards in Odia/Hindi.
- Compare up to three students; term-end summary.
**Won't (now)**
- Teacher performance analytics dashboard, multi-centre admin, billing.

### 8.5 Solution overview
Six screens (designed; see appendix): Home, Enter marks, Save confirmation, Teacher report,
Parent share + cards, Growth tracker. One engine, three outputs.

### 8.6 Key functional rules (the ones that protect trust)
- Percentage is computed, never stored; raw marks never compared across different full-mark tests.
- Absent ≠ zero — absentees are excluded from every average and skipped on the growth line.
- Save is guarded: a blank, non-absent student blocks save until resolved.
- Privacy wall: a parent's card carries rank vs class average only — never other children's data.
- Empty states are first-class: growth needs ≥2 tests or it shows guidance, not a broken chart.

### 8.7 Non-functional requirements
Mobile-first; works on the centre's phones. Fast (entry under 3 min). Per-centre data isolation
(row-level security). Localisable strings. Print-clean output.

### 8.8 Data model (summary)
Four entities — Centre, Student, Test, Result — with auth-scoped access. (Full schema in appendix.)

---

## 9. Prioritisation (RICE)
Scored 1–5 for impact/confidence; effort in relative weeks; score = R×I×C / E (directional).

| Feature | Reach | Impact | Confidence | Effort | Priority |
|---|---|---|---|---|---|
| Marks entry + class report | High | 5 | 5 | 2 | P0 — the loop |
| Parent card + WhatsApp share | High | 5 | 4 | 2 | P0 — the value |
| Save confirmation + validation | High | 3 | 5 | 1 | P0 — trust |
| Growth tracker | Med | 4 | 4 | 3 | P1 — needs data |
| Bulk WhatsApp via Business API | Med | 4 | 3 | 4 | P1 — scale |
| Odia/Hindi parent cards | Med | 4 | 4 | 2 | P1 — comprehension |
| Teacher performance analytics | Low (now) | 5 | 3 | 4 | P2 — owner value |
| Multi-centre / admin | Low (now) | 4 | 2 | 5 | P2 — productise |

---

## 10. MVP definition
**In:** marks entry, teacher class report, parent card + manual WhatsApp (click-to-chat) share,
save validation, single-centre login. This proves the whole loop end to end with real users.
**Out (deliberately):** growth tracker (needs accumulated data), bulk API, analytics, localisation.
The MVP's job is to answer one question: *will teachers enter marks, and do parents value the card?*

---

## 11. Roadmap (Now / Next / Later)

**Now (MVP / POC)** — prove the loop
- Enter marks → teacher report → parent card → click-to-chat share. Single centre. Free-tier infra.

**Next** — deepen value once data accumulates
- Growth tracker (class + individual), editable auto-notes, Odia/Hindi cards, bulk WhatsApp API,
  move infra to paid tier (backups, no pausing).

**Later** — productise & differentiate
- Teacher performance analytics for owners (the deeper transparency), term-end summaries,
  multi-centre admin, and a path from single centre to a product other centres could use.

---

## 12. Go-to-market / rollout
1. **Dogfood** at my own centre with one or two classes — I am user zero.
2. **Pilot** with all teachers for one term; watch the North Star (test→parent within 48h).
3. **Iterate** on the single biggest drop-off (likely entry speed or share friction).
4. **Expand** within the centre, then consider a second centre as the first external validation.
Distribution advantage: the parent card is inherently viral — parents see a professional, branded
report and associate it with the centre, which aids both retention and word-of-mouth admissions.

---

## 13. Risks, assumptions & open questions
- **Assumption:** teachers will adopt digital entry if it's genuinely under 3 minutes. *Mitigation:* design entry as the hero screen; measure time-per-test as a guardrail.
- **Risk:** WhatsApp bulk send at scale needs the Business API (cost + template approval). *Mitigation:* pilot on click-to-chat; upgrade only after parents prove they value it.
- **Risk:** a single wrong average destroys trust. *Mitigation:* save validation, absent handling, percentage-only comparison.
- **Risk:** privacy — a parent must never see other children's marks. *Mitigation:* privacy enforced in send logic, not just copy.
- **Open question:** is teacher analytics motivating or threatening to teachers? Needs framing as growth, not surveillance — validate in interviews before building.

---

## 14. Measurement & instrumentation
Track the funnel: test created → marks saved → report viewed → cards sent → cards opened. The biggest
single number to watch is the North Star (test→parent within 48h); the biggest leading indicator is
median entry time. Review weekly during pilot.

---

## 15. Technology & architecture (kept deliberately lightweight)
A single-page app (built with an AI coding agent) on Vercel, backed by Supabase for auth and a
Postgres database with row-level security so each centre sees only its own data. Reports are computed
views over four tables — never stored — so they're always correct. This stack is chosen for a POC:
free to start, fast to ship, and able to scale to paid tiers without an architecture rewrite.
(Diagram and schema in appendix.)

---

## 16. Reflections — what this project shows about me as a PM
- I started from a real, observed problem and resisted jumping to features.
- I made hard scope cuts (non-goals) to keep an MVP shippable.
- I designed for three different readers from one dataset, and protected the trust-critical edges
  (absent handling, percentage comparability, privacy) that are easy to miss and expensive to get wrong.
- I sequenced by learning value: prove the loop first, add depth once data exists, productise last.
- As a non-traditional-tech PM, I used AI tooling to take this end-to-end — discovery, design, spec,
  schema and a working build — which is itself the modern PM skill: turning a clear problem into a
  shipped product without waiting on a team.

What I'd do differently next time: run 5–8 structured parent interviews *before* designing the card,
to validate the "WhatsApp, in-language, trajectory-first" hypothesis with evidence rather than intuition.

---

## 17. Appendix — artifacts produced
- Screen designs: Home, Enter marks, Save confirmation, Teacher report, Parent share + cards, Growth tracker.
- Flow map (screen → click → output).
- System architecture diagram (frontend / Vercel / Supabase / outputs).
- Build specification (data model, screens, states, acceptance criteria).
- Supabase storage addendum (schema SQL + row-level security).
- Idea-to-product journey map.
