# Engineering & Design Rules for JobPost X-Ray

You are the AI coding agent for **JobPost X-Ray**: a bilingual (EN/AR) Next.js SaaS that turns a LinkedIn post into an AI report and an optional Gmail draft, via Web and Telegram. Read this file fully before writing code. When a rule here conflicts with a quick shortcut, the rule wins. If a rule is genuinely wrong for the task, say so and ask; do not silently break it.
Reference docs: `vision.md` (product + roadmap), `schema.sql` (DB source of truth), `job-xray.json` (legacy n8n logic to port), `README.md` (domain behavior).

---

## 0. Hard Rules (never violate)

1. **Every file < 300 lines.** Split into components, hooks, helpers, services before reaching ~250.
2. **Strict TypeScript.** `"strict": true`, `noUncheckedIndexedAccess: true`. No `any`, no `@ts-ignore`, no non-null `!` without a comment explaining why it is safe. Use `unknown` + Zod at boundaries.
3. **Zod validates every external input and output:** request bodies, Telegram updates, webhooks, Apify results, LLM output, env vars.
4. **No secrets in code, logs, client bundles, or git.** See Section 8.
5. **Database access only in `lib/db/queries/`.** No SQL or ORM calls anywhere else.
6. **Server Actions and route handlers are thin dispatchers** (validate, authorize, delegate, return in < 200ms). Long work goes to the background orchestrator.
7. **RTL-first CSS.** Logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`). Never `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `float-left/right`.
8. **No hardcoded user-facing strings.** All text lives in `messages/en.json` and `messages/ar.json`.
9. **Quota is consumed only after a report is successfully delivered**, atomically, once.
10. **Never invent data.** Emails, names, company facts must come from source data (see Section 6.3).
11. **Temporary scripts & files in `temp_scripts/` only:** All temporary test, diagnostic, or scratch scripts MUST be placed in `temp_scripts/` and auto-deleted once the feature or task is complete. Never leave scratch files in the root or commit them.
12. **Nested Widget Containment:** Inner widgets, child components, buttons, and badges must NEVER exceed, overflow, or bleed outside the bounding edge of their parent container. Always use defensive wrapping (`flex-wrap`, `min-w-0`, stacked defaults) and overflow containment so elements never poke out into surrounding whitespace.
13. **Screen Real Estate & Arabic Layout:** Leverage the full responsive desktop viewport (`max-w-7xl` or dynamic grids) instead of artificially narrow containers. Arabic text (Cairo font) requires generous horizontal clearance—cards must never be squished into tight columns that cause excessive, tall, and awkward line wrapping.
14. **Cross-Device Responsiveness & Mobile Burger:** All pages must be fully responsive across desktop, tablet, and mobile. On mobile/small screens (`< md`), navigation must collapse into an accessible slide-out/modal hamburger menu (`menu burger`) rather than crowding the header bar.

---
## 1. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React Server Components first |
| Language | TypeScript strict |
| Styling | Tailwind CSS + CSS variables for tokens; `cva` for component variants |
| UI primitives | Radix UI / shadcn-style components, restyled to our tokens |
| i18n | `next-intl` (locale segment `[locale]`, `dir` set on `<html>`) |
| DB | PostgreSQL (Supabase) via Drizzle ORM (typed queries) |
| Auth | Auth.js (Google OAuth), database sessions |
| Background jobs | Inngest (or Trigger.dev); one job = one pipeline run |
| AI | Vercel AI SDK, Gemini primary, Claude fallback, Zod-validated structured output |
| Scraping | Apify client (server only) |
| Billing | Stripe (or LemonSqueezy), webhook-driven |
| Validation | Zod |
| Testing | Vitest (unit), Playwright (e2e), MSW (mock external APIs) |
| Quality | ESLint (strict + `no-restricted-syntax` for directional classes), Prettier, Husky + lint-staged |
| Errors | Sentry; structured logs with `pino` |

Do not add a dependency without a one-line justification in the PR/commit message. Prefer the platform and existing deps.

---

## 2. Folder Architecture

```
app/[locale]/       # (marketing) public, (auth) sign-in, (app) dashboard/settings/profile, (admin)
app/api/            # auth/[...nextauth], telegram/webhook, billing/webhook, inngest, health
components/         # ui/ primitives, features/ (report, profile, settings, test-bench), layout/
lib/db/             # client.ts, schema/ (users, workflows, access, credentials), queries/
lib/services/       # gatekeeper, scraper, ai, email, telegram, billing
lib/                # actions/, validation/, security/, env.ts, errors.ts, result.ts, logger.ts
hooks/ | types/ | messages/ (en.json, ar.json) | styles/ | tests/ | drizzle/
```

**Dependency direction (enforce with ESLint import rules):**
`app/ → actions/ → services/ → db/queries/ → db/schema`. Services never import from `app/`, `components/`, or `next/*`. Components never import from `lib/db`, `lib/services`, or `lib/security`. Violations are bugs.

**Naming:** files `kebab-case.ts`; React components `PascalCase` exported from `kebab-case.tsx`; one component per file; hooks `use-thing.ts`; Zod schemas `thingSchema`, inferred types `Thing`. Prefer named exports; default exports only where Next requires them.


---

## 3. Backend Rules

### 3.1 Layers
- **Route handler / Server Action:** parse + validate input (Zod), resolve the session or Telegram identity, call the gatekeeper, enqueue or call one service, map result to response. No business logic.
- **Service:** pure business logic. Takes typed input, returns `Result<T, AppError>`. Dependencies (db queries, clients) are imported or injected so they can be mocked.
- **Query module:** one file per aggregate (`users.ts`, `job-runs.ts`, `access.ts`). Functions are small, typed, and named by intent (`getAccessForUser`, `markRunFailed`). Parameterized only. No string-built SQL.
- **Client modules** (Apify, Gemini, Claude, Gmail, Telegram, Stripe): wrap each SDK in one file with timeouts, retries with backoff, and typed returns. Nothing else touches the SDK.

### 3.2 Errors
- Throw/return `AppError(code, httpStatus, safeMessage, cause?)`. Codes mirror the gatekeeper: `UNREGISTERED`, `ACCOUNT_PENDING`, `ACCOUNT_REJECTED`, `ACCOUNT_LOCKED`, `WORKFLOW_FORBIDDEN`, `WORKFLOW_DISABLED`, `ACCESS_EXPIRED`, `QUOTA_EXCEEDED`, plus `SCRAPE_EMPTY`, `SCRAPE_FAILED`, `AI_FAILED`, `INVALID_URL`.
- User-facing messages come from i18n keys by error code. Never leak stack traces, SQL, provider errors, or internal IDs to clients.
- Catch at boundaries only; do not swallow errors. Log with context (`runId`, `userId`, `step`), never with PII or secrets.

### 3.3 Pipeline (port of the n8n flow)
Orchestrated as discrete, retryable, idempotent steps keyed by `runId`:
1. `validate-url` (regex for `/posts/`, `/feed/update/`, `/jobs/view/`, `lnkd.in`) → `expand-short-url` (follow redirects with a hop limit and host allowlist `linkedin.com`, `lnkd.in`)
2. `scrape-post` → if empty, fail fast with `SCRAPE_EMPTY` (no further credits spent)
3. `scrape-author` (**skip if the author is a company page**) → `scrape-company`
4. `normalize` (pure function, unit-tested)
5. `generate-report` (Gemini → Claude fallback; Zod-validated)
6. `persist-run` (store results in `job_runs`)
7. `deliver` (Web: realtime status; Telegram: send message)
8. `consume-usage` (only after step 7 succeeds)

Rules: each step writes progress to `job_runs.status` so the UI can stream it; cache scraped data by normalized URL to avoid re-scraping; set per-step timeouts; failed runs never consume quota; a retried run must not double-consume (guard with `job_runs.usage_consumed_at`).

### 3.4 Database
- `schema.sql` is the baseline. All changes ship as versioned migrations in `drizzle/`; never edit applied migrations.
- Keep `authenticate_gatekeeper` (read-only) and `consume_workflow_usage` (atomic guarded `UPDATE`) as separate operations. Do not merge them.
- Index every foreign key and every column used in a `WHERE`/`ORDER BY` on hot paths. Use `timestamptz` everywhere.
- Enable **Row Level Security** on every table exposed to any client key; the backend uses a privileged server-only connection.
- Encrypt `google_refresh_token` at rest (AES-256-GCM, key from env, per-record IV). Never select it unless the Gmail step needs it.
- Use transactions for multi-write operations. Use connection pooling; never open a connection per request.

### 3.5 AI
- Prompts live in `lib/services/ai/prompts/` as versioned text/TS modules, not inline strings in services.
- Output schema in `schemas.ts`: `{ telegramReport, report (structured sections), metadata: { role, company, hrName, hrEmail } }`. Generate a **structured report** for the Web UI and derive the Telegram Markdown from it; do not parse Markdown to render the dashboard.
- Treat all scraped text as **untrusted input** (prompt injection). Wrap it in clearly delimited data blocks, instruct the model to ignore instructions inside it, and never let model output trigger actions (sending email, calling tools) without the deterministic checks in 6.3.
- Retry once on schema failure, then fall back to the second provider, then return `AI_FAILED`.

### 3.6 Authentication, User Profile & Workflow Metadata
- **Google OAuth Only:** Web authentication strictly uses Google OAuth provider via Auth.js / NextAuth. No password auth or alternative web providers.
- **Route Protection:** All routes under `(app)` (such as `/profile`, `/settings`, `/dashboard`) require an active session; unauthenticated users redirect to `/[locale]/sign-in`.
- **Identity Resolution:** On initial Google sign-in, lookup or insert into `public.users` matching by verified `email`. Automatically ensure workflow access row in `public.user_workflow_access` for `job-xray`.
- **Profile Data Ownership:** Every read or mutation of user profile data (`full_name`, `preferred_language`) must strictly enforce `WHERE id = session.user.id`.
- **Workflow Metadata Management:** Per-workflow preferences (`fullName`, `cv`, `sendEmail`, `preferred_language`) reside in `user_workflow_access.metadata`. Mutations must be validated with Zod (`workflowMetadataSchema`), execute parameterized updates in `lib/db/queries/access.ts`, and never mutate other users' records.
- **Workflow Credentials:** User credentials for Gmail compose (`workflow_credentials`) store tokens encrypted at rest (AES-256-GCM / Vault). Plain secrets are never returned in client JSON responses or logs.
- **Telegram Account Linking:** Web user linking to Telegram identity must use single-use cryptographic tokens with a 10-minute expiry (command `/connect <TOKEN>`).

---

## 4. Frontend Design Pattern

### 4.1 Component architecture
- **Server Components by default.** Add `"use client"` only for state, effects, or browser APIs, and push it to the smallest leaf.
- Data fetching in server components or server actions; client components receive typed props. Use React Query/SWR only for polling/streaming job status.
- Feature components live in `components/features/<feature>/` with their own `index.ts`. UI primitives in `components/ui/` have no business logic and no data fetching.
- Props are typed interfaces, not inline objects; avoid prop drilling past two levels (use composition or context).
- Forms: `react-hook-form` + Zod resolver; server action re-validates the same schema.
- Every async surface has **four states designed**: loading (skeleton matching final layout), empty (helpful + next action), error (plain-language + retry), success.

### 4.2 Design tokens (define once in `styles/globals.css`, consume via Tailwind)

| Token | Dark (default) | Use |
|---|---|---|
| `--bg` Obsidian | `#090D16` | App background |
| `--surface` Slate | `#0F172A` | Cards, panels |
| `--surface-2` | `#162036` | Raised/hover surfaces |
| `--border` | `rgba(148,163,184,.14)` | Hairlines |
| `--text` / `--text-muted` | `#E6EAF2` / `#8B97AD` | Copy |
| `--accent` Indigo | `#6366F1` | Primary actions, focus ring |
| `--success` Emerald | `#10B981` | Success, "found email", completed steps |
| `--warn` / `--danger` | `#F59E0B` / `#F43F5E` | Flags, errors |

Provide a light theme through the same variable names; never hardcode hex values in components. Check contrast ≥ 4.5:1 for text (≥ 3:1 for large text and UI borders).

### 4.3 Typography
- EN: **Inter** body, **Plus Jakarta Sans** headings. AR: **Cairo** for all text. Load with `next/font`, swap per locale, subset appropriately.
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48. Body line-height 1.6 (Arabic 1.8). Max reading width 68ch.
- Arabic: no letter-spacing, no uppercase transforms, no italics. Use Western digits unless the product decides otherwise; be consistent.

### 4.4 Make it feel designed, not generated
The result must not look like a stock AI landing page. Concretely:

**Do**
- Use **real product content**: an actual sample report, real field names, real numbers from the unit economics. Never lorem ipsum or "Feature One".
- Build **one strong visual idea** (e.g. the "X-ray": a post being separated into layers — Post → Poster → Company — as a layered, offset card stack) and reuse it as the brand motif.
- Use a **tight, opinionated layout:** asymmetric hero, varied section rhythm (full-bleed, split, dense table, big-number strip). Align to an 8px grid; keep generous but consistent spacing.
- Use **glassmorphism sparingly:** only on 1–2 floating surfaces (nav, report header). Subtle blur (8–16px), 1px hairline borders, low-opacity fills. Most surfaces are flat and solid.
- Prefer **information density with clarity** in the dashboard: tables, compact cards, clear hierarchy, keyboard shortcuts for power users.
- Use **icons from one set** (Lucide) at one stroke width, aligned with text. Use illustrations only when custom and purposeful.
- Motion: 150–250ms ease-out for state changes; stagger the analysis stepper; animate progress with real job events, not fake timers. Respect `prefers-reduced-motion`.

**Don't**
- No purple-to-blue gradient hero with floating glowing orbs, no grid-of-three identical cards with emoji icons, no "Supercharge your workflow" copy, no generic stock mockups, no gradient text on every heading, no excessive shadows, no random emoji as UI.
- No more than one gradient accent per screen. Indigo is an accent, not a wallpaper.
- Copy is specific and plain: say what it does ("Paste a LinkedIn post. Get the poster, the company, and a draft email.").

### 4.5 Core screens & patterns
- **Landing:** hero with live/sample report, 3-step "how it works" shown with the layered-card motif, pricing table (honest, no dark patterns), FAQ, bilingual switch in the header.
- **Dashboard:** URL input with inline validation and paste detection; analysis stepper bound to `job_runs.status`; report view with sections (Role, Poster, Company, Flags); sticky action bar (Create Gmail Draft, Copy, Export, Open in Telegram); history table with search/filter.
- **Report rendering:** render from the structured report schema, not raw Markdown. Flags use ⚠️/ℹ️ semantics via icon + color + text (never color alone). Emails shown in a monospace chip with copy button.
- **Settings:** language, CV upload (PDF/DOCX, size and type validated, drag-and-drop with keyboard fallback), Telegram link (`/connect <TOKEN>`), plan and usage meter.
- **Admin:** dense tables, filters, audit log, manual quota adjust with confirmation dialog.

### 4.6 Accessibility & responsiveness
- WCAG 2.2 AA. Semantic HTML, one `<h1>` per page, landmarks, visible focus ring (`--accent`, 2px, offset 2px), full keyboard support, `aria-live="polite"` for status updates, labeled form controls, 44px minimum touch targets.
- Mobile-first. Breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`. Test every screen at 360px and 1440px, in LTR and RTL.
- **Desktop & Screen Real Estate:** Expand main layouts (`max-w-7xl` or dynamic grids) so Arabic typography (Cairo) and dense dashboards have ample horizontal space without tall, cramped line wraps.
- **Mobile Hamburger Navigation:** On mobile and small screens (`< md`), navigation controls and secondary actions collapse into an accessible slide-out/modal hamburger menu (`menu burger`) to keep the top bar clean and spacious.
- **Nested Widget Containment:** Ensure inner cards, button bars, and interactive widgets never exceed parent boundaries. Use `min-w-0`, `flex-wrap`, defensive stacking, and overflow containment.
- Use `next/image`, lazy-load below the fold, no layout shift (reserve space), target LCP < 2.5s, INP < 200ms.

---

## 5. Bilingual & RTL Rules

- Locale in the URL (`/en/...`, `/ar/...`). `<html lang dir>` set from locale. Default from user preference (`users.preferred_language`), then `Accept-Language`.
- Logical properties only (Hard Rule 7). For flex/grid prefer `gap`, `justify-start/end`, `items-start`.
- **Mirror** directional icons (arrows, chevrons, back/next) with `rtl:-scale-x-100`; do **not** mirror logos, checkmarks, or media controls.
- Mixed-direction text (English company names inside Arabic): wrap with `<bdi>` or `dir="auto"`; emails, URLs, and code are always `dir="ltr"` inline.
- Telegram: send `is_rtl: true` for Arabic; keep report structure identical across languages.
- Use `Intl.DateTimeFormat` / `Intl.NumberFormat` with the active locale. Pluralization via ICU messages.
- Every new string is added to **both** `en.json` and `ar.json` in the same change. Arabic copy must be natural, not literal translation; flag uncertain translations for human review.
- A CI check fails if message keys differ between locales or if directional utility classes are found.

---

## 6. Domain Rules to Preserve

1. **Gatekeeper first.** Every Web action and Telegram update passes `authenticate_gatekeeper` before any paid work. Unauthorized/expired/quota-exceeded users get a localized message with the error code.
2. **Quota edge case:** a user at quota may still answer an existing "draft an email?" prompt (drafting is free).
3. **No hallucinated emails.** `hrEmail` is non-null only if (a) the address literally appears in the post text, and (b) the post explicitly names it as the application channel. Enforce this **in code**, not just in the prompt: after the LLM responds, verify the email string exists in the source text with a regex and discard it otherwise. Never source an email from `about`, website, or inference.
4. **Drafts only.** Never send email automatically. Use the `gmail.compose` scope only (no read access). Show the user the draft link.
5. **Credit saving:** stop on empty scrape, skip the author scraper for company posts, reuse cached scrapes.
6. **Reports are AI-generated from scraped text;** show a short "verify before applying" note in the UI.
7. **Telegram stateless prompts:** prefer storing prompt state server-side (`pending_actions` table keyed by a short random token in `callback_data`, expiring in 24h). Do not put metadata in hidden links as the legacy n8n flow did.

---

## 7. Telegram Integration

- Webhook route verifies the `X-Telegram-Bot-Api-Secret-Token` header using constant-time comparison; reject otherwise with 401 and no body.
- Parse updates with a Zod discriminated union (`message` | `callback_query`); ignore unknown types with 200.
- Respond to the webhook within a second: validate, enqueue, return 200. Send progress via `editMessageText`. Handle Telegram 429 `retry_after`.
- Escape all dynamic text for the chosen parse mode in one helper (`escapeMarkdownV2`); never concatenate unescaped user or scraped text.
- Account linking: one-time token, 10-minute expiry, single use, stored hashed.

---

## 8. Security (non-negotiable)

**Secrets**
- All secrets only in environment variables, validated at boot in `lib/env.ts` (Zod). App fails fast if one is missing. Server-only vars are never imported in client code; use `import "server-only"` in every module touching secrets.
- Only `NEXT_PUBLIC_*` vars are browser-safe, and only for non-secret values (site URL, publishable keys).
- Commit `.env.example` with placeholder values only. `.env*` (except example) is in `.gitignore`. Never print, log, or return a secret, token, or full connection string. Never paste real keys into code, tests, fixtures, prompts, or docs.
- Rotate on suspected exposure. Use separate keys per environment.

**Application**
- AuthN/AuthZ on every route, action, and query path; **authorize by resource ownership** (`WHERE user_id = :sessionUser`) so one user can never read another's runs, CVs, or tokens. Admin routes check `role = 'admin'` server-side.
- Validate and sanitize all input; reject unknown fields (`.strict()`). Parameterized queries only.
- **SSRF protection** on URL expansion and any fetch of user-supplied URLs: allowlist hosts, block private/loopback/link-local IP ranges, cap redirects (≤ 5), set timeouts and response-size limits.
- Rate-limit by user and IP (auth, analyze, Telegram link, webhook endpoints). Return 429 with `Retry-After`.
- CSRF: Server Actions with origin checks; SameSite=Lax (or Strict) cookies, `HttpOnly`, `Secure`.
- Security headers in `next.config`/middleware: CSP (nonce-based, no `unsafe-inline` for scripts), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Render AI/scraped content as **text**, never `dangerouslySetInnerHTML`. If Markdown is rendered, use a sanitizing renderer with an allowlist.
- File uploads: verify MIME by magic bytes, max size (e.g. 5 MB), PDF/DOCX only, random storage names, private bucket, signed URLs with short expiry, optional malware scan.
- Webhooks (Stripe, Telegram, Inngest): verify signatures on the raw body; make handlers idempotent (store event IDs).
- Least privilege: separate DB roles for app vs. migrations; Google scope limited to `gmail.compose`; Apify and AI keys restricted where providers allow.
- Privacy: store the minimum scraped data; provide delete-my-data; retention policy for `job_runs`; do not log post text, CVs, or email bodies. Mention the LinkedIn ToS/privacy disclaimer in the legal pages.
- Dependency hygiene: lockfile committed, `npm audit`/Dependabot in CI, pin major versions, no postinstall scripts from unknown packages.

---

## 9. Testing & Quality

- **Unit-test** pure logic: URL validation/expansion rules, normalizer, email-extraction guard, quota logic, formatters, Zod schemas.
- **Integration-test** query modules against a test Postgres (`consume_workflow_usage` concurrency must never exceed the limit).
- **Mock** Apify, AI, Gmail, Telegram, Stripe with MSW/fakes. Tests never call paid APIs or use real secrets.
- **E2E (Playwright):** sign-in, analyze flow with fixtures, RTL snapshot, quota-exceeded state, draft creation.
- CI order: typecheck → lint → i18n parity → unit → build → e2e. A failing line-count check (`> 299 lines`) fails CI.
- Add an a11y check (axe) on key pages in both locales.

---
## 10. Working Method for the AI Agent

1. **Read before writing.** Inspect existing modules and reuse them; do not duplicate helpers.
2. **Plan small.** Deliver in vertical slices following `vision.md` stages. State the slice, files to touch, and risks in a few lines before coding larger changes.
3. **Keep files small** and cohesive; extract as you go rather than refactoring at the end.
4. **Comments explain why, not what.** Public service functions get a short TSDoc with inputs, outputs, and error codes.
5. **No dead code, no TODO without an issue reference, no `console.log`** (use the logger).
6. **Migrations and schema changes** need a note on rollback and on backfill for existing rows.
7. **Never fabricate** API shapes: check provider docs/SDK types; when unsure, write a typed adapter and a Zod schema, and test it against a fixture.
8. **Ask** when requirements are ambiguous or a change affects billing, auth, quota, or data retention.
9. **Temporary script hygiene:** Place all scratch testing files in `temp_scripts/` and auto-delete them once testing or implementation is complete.

### Definition of Done
- [ ] Compiles with strict TS, lint clean, no `any`
- [ ] All files < 300 lines; layers respected
- [ ] Inputs/outputs validated with Zod
- [ ] No secrets or PII in code/logs; authorization checked on the resource
- [ ] EN and AR strings added; checked in RTL at 360px and 1440px
- [ ] Loading / empty / error / success states implemented
- [ ] Keyboard and screen-reader pass; contrast verified
- [ ] Tests added or updated; CI green
- [ ] Docs updated (`README.md`, `.env.example`, migration notes) when behavior or config changed
