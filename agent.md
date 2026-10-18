# 🤖 AGENT CODEBASE GUIDELINES & ARCHITECTURAL MANIFESTO

> **MANDATORY READING:** The AI agent must read, internalize, and strictly adhere to this document before generating, editing, or refactoring any code in the **JobPost X-Ray** project.

---

## 1. Core Principles & Code Constraints

### 📏 The 300-Line Rule (Hard Limit)
- **Maximum file length: 300 lines.** No file shall exceed 300 lines under any circumstance.
- **Proactive Decomposition:** If a file approaches ~250 lines, it must be proactively split into smaller, focused modules:
  - Complex components $\rightarrow$ decompose into sub-components (`/components/features/...`).
  - Monolithic functions $\rightarrow$ extract business logic into `/services` or pure helper functions in `/lib/utils`.
  - Massive schemas or types $\rightarrow$ isolate into dedicated `/types` or `/schemas` files.
- **Single Responsibility Principle (SRP):** Each file must do one thing well (e.g., one component, one service function, one DB query collection, or one schema definition).

---

## 2. Directory Architecture & Layered Separation of Concerns

The project follows a **Clean Feature-Driven Architecture** within the Next.js App Router:

```
src/
├── app/                        # Next.js App Router (Pages, Layouts, Route Handlers)
│   ├── (auth)/                 # Auth routes (login, onboarding)
│   ├── (dashboard)/            # Authenticated user dashboard
│   ├── (marketing)/            # Public landing page & pricing
│   ├── admin/                  # Admin portal & telemetry
│   └── api/                    # Webhooks & Route Handlers (/api/telegram, /api/stripe)
│
├── actions/                    # Next.js Server Actions (Lightweight Dispatchers)
│   ├── analyze-job.ts          # Validates & dispatches job (<200ms)
│   ├── create-draft.ts         # Fast Gmail draft creation (<1.5s)
│   └── user-settings.ts        # Updates profile, language, CV
│
├── components/                 # Reusable Presentation Layer
│   ├── ui/                     # Base primitives (shadcn / Radix: Button, Input, Modal...)
│   ├── layout/                 # Header, Sidebar, Footer, DirectionProvider
│   └── features/               # Feature-specific components
│       ├── analysis/           # JobSearchInput, StatusStepper, ReportViewer, FitCard
│       ├── dashboard/          # HistoryTable, QuotaBadge, StatsCards
│       ├── billing/            # PricingCards, CheckoutButton
│       └── admin/              # UserTable, ScraperMetricsChart
│
├── lib/                        # Infrastructure, Third-Party Clients & Database
│   ├── db/                     # Database Access Layer (Drizzle / Supabase)
│   │   ├── client.ts           # Connection pool & client instance
│   │   ├── schema.ts           # Database tables & relations
│   │   └── queries/            # Isolated, reusable DB query functions
│   │       ├── users.ts        # getUserById, syncGoogleUser
│   │       ├── gatekeeper.ts   # checkAccess, consumeQuota
│   │       └── jobs.ts         # createJobRun, getJobWithDetails
│   ├── scrapers/               # External scraper services (Apify)
│   │   ├── post-scraper.ts
│   │   ├── author-scraper.ts
│   │   └── company-scraper.ts
│   ├── ai/                     # LLM orchestration & prompt management
│   │   ├── client.ts           # Gemini primary, Claude fallback
│   │   └── prompts.ts          # Localized system prompts
│   ├── email/                  # Gmail API & MIME composer
│   │   ├── gmail.ts
│   │   └── mime-builder.ts
│   └── utils/                  # Pure helper functions
│       ├── linkedin-url.ts     # Regex validators & URL expander
│       ├── formatters.ts       # Date, currency, string formatters
│       └── errors.ts           # Custom error classes & codes
│
├── i18n/                       # Localization & Bilingual Engine
│   ├── config.ts               # Locales (en, ar), default locale, RTL mapping
│   ├── dictionaries/           # Static translations
│   │   ├── en.json
│   │   └── ar.json
│   └── use-translation.ts      # Client hook & server dictionary getter
│
└── types/                      # Shared TypeScript definitions & Zod schemas
    ├── database.ts
    ├── analysis.ts
    ├── api.ts
    └── env.ts
```

---

## 3. Layered Design Patterns

### A. Database Access Layer (`lib/db/queries/`)
- **No direct database queries inside UI components or API handlers.**
- All queries and mutations must live in dedicated files inside `lib/db/queries/`.
- Every database interaction must be wrapped with typed return signatures and error handling.
- Atomic operations (like quota checks and increments) must utilize PostgreSQL functions or transactions.

### B. Server Actions Layer (`actions/`)
- **Server Actions must be thin dispatchers.**
- Never run long-running tasks (>10s) directly inside a synchronous Server Action.
- Follow the pattern:
  1. Validate input using **Zod**.
  2. Authenticate session / gatekeeper via `lib/db/queries/gatekeeper.ts`.
  3. Dispatch task to background queue / database.
  4. Return a lightweight, typed result `{ success: boolean; data?: T; error?: string }`.

### C. Services Layer (`lib/scrapers/`, `lib/ai/`, `lib/email/`)
- Pure business logic. Completely decoupled from HTTP requests and React.
- Easy to unit test in isolation without spinning up Next.js.
- Must implement defensive fallback logic (e.g., Gemini $\rightarrow$ Claude failover).

### D. Presentation Components (`components/`)
- Pure presentation. Components receive data and callbacks via props.
- Keep components small (<150 lines per component).
- Extract complex UI fragments into distinct sub-components.

---

## 4. Visual Design System & Aesthetics

### 🎨 Color Palette & Design Tokens
The design reflects an **Executive Recruitment Intelligence / Modern Cyber** aesthetic. Sleek, high-contrast dark theme with purposeful accent pops.

| Token | Hex / Value | Usage |
|---|---|---|
| **Background Deep** | `#090D16` | Main app background, rich obsidian |
| **Background Surface** | `#0F172A` / `#131C31` | Card surfaces, modals, popovers |
| **Background Elevate** | `#1E293B` | Hover states, active list items |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | Glassmorphism card borders |
| **Border Active** | `rgba(99, 102, 241, 0.35)` | Focused inputs, highlighted active cards |
| **Primary Accent** | `#6366F1` (Indigo 500) | Primary CTA buttons, active tabs, progress |
| **Secondary Accent** | `#06B6D4` (Cyan 500) | Secondary badges, technical highlights |
| **Success / Verified** | `#10B981` (Emerald 500) | Authorized badges, verified contact email |
| **Warning / Attention** | `#F59E0B` (Amber 500) | Missing author data, quota low notice |
| **Danger / Error** | `#F43F5E` (Rose 500) | Scrape failure, unauthorized, quota exceeded |
| **Text Primary** | `#F8FAFC` (Slate 50) | Main headings, report body, key metrics |
| **Text Secondary** | `#94A3B8` (Slate 400) | Metadata, labels, subtle captions |
| **Text Muted** | `#64748B` (Slate 500) | Timestamps, placeholder text |

### 💎 UI Styling Rules
1. **Glassmorphism & Depth:**
   - Use subtle backdrop blurs: `backdrop-blur-md bg-slate-900/60 border border-white/10`.
   - Subtle outer glow for primary interactive elements on hover: `hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]`.
2. **Typography:**
   - English: `Inter` or `Plus Jakarta Sans` for clean, professional legibility.
   - Arabic: `Cairo` or `IBM Plex Sans Arabic` for crisp, native typography.
   - Code/Monospace: `JetBrains Mono` or `Fira Code` for URLs, emails, and data payloads.
3. **Micro-Interactions:**
   - Use `framer-motion` for smooth layout transitions, step progress animations, and collapsible cards.
   - Interactive elements must have clear hover, active, disabled, and focus-visible states.

---

## 5. Bilingual & RTL Architecture (English & Arabic)

The platform is bilingual from the ground up:

### 1. Direction & Logical Properties (Strictly Enforced)
- **Never use hardcoded directional CSS:** Avoid `mr-*`, `ml-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`.
- **Always use CSS Logical Properties:**
  - Margin & Padding: `ms-*` (margin-inline-start), `me-*` (margin-inline-end), `ps-*`, `pe-*`.
  - Alignment: `text-start`, `text-end`.
  - Insets: `start-0`, `end-0`.
  - Rounded corners: `rounded-s-*`, `rounded-e-*`.
- The root layout or container must toggle `dir="ltr"` or `dir="rtl"` based on the active locale.

### 2. Localization Dictionaries
- Translations live in typed JSON files (`i18n/dictionaries/en.json` and `ar.json`).
- Avoid hardcoded English or Arabic strings in JSX. Every label, error message, button, and tooltip must reference translation keys.
- AI generated reports must dynamically honor the user's `preferred_language` (`ar` or `en`).

---

## 6. UI Tooling & Libraries

- **Framework:** Next.js 15+ (App Router, Server Components by default, Client Components only when interactive).
- **Styling:** Tailwind CSS with custom configuration for design tokens and RTL support.
- **Primitives & Icons:**
  - Headless Primitives: Radix UI (`@radix-ui/react-*`) or `shadcn/ui`.
  - Icons: `lucide-react` (clean, tree-shakeable SVG icons).
- **Animations:** `framer-motion` (for step steppers, accordion expansion, and fade-ins).
- **Forms & Validation:** `react-hook-form` + `@hookform/resolvers/zod`.
- **Data Fetching & Realtime:** Supabase Realtime client or lightweight polling via TanStack React Query.

---

## 7. TypeScript & Defensive Programming Standards

### 🛡️ Code Quality Standards
1. **Strict TypeScript:**
   - `"strict": true` in `tsconfig.json`.
   - **`any` is strictly prohibited.** Use `unknown`, generic types, or define an explicit interface.
2. **Runtime Validation with Zod:**
   - Every external payload (Apify dataset items, LLM outputs, incoming webhook requests, URL inputs) must be validated with a **Zod Schema** before usage.
3. **Exhaustive Error Handling:**
   - All async operations must have structured `try / catch` blocks.
   - Return normalized error objects `{ success: false, error: { code: string, message: string } }`.
4. **Environment Safety:**
   - Centralize environment variables in `types/env.ts` with Zod schema parsing. Fail fast at startup if an API key is missing.

---

## 8. Agent Pre-Implementation Checklist

Before committing any file or proposing code changes, the AI Agent must verify:

- [ ] **File Size:** Is the file strictly under 300 lines? If not, decompose it immediately.
- [ ] **Separation:** Is database logic placed in `lib/db/queries/` and not directly inside the UI or Server Action?
- [ ] **RTL Compliance:** Are all Tailwind spacing and alignment classes using logical properties (`ps-`, `pe-`, `ms-`, `me-`, `text-start`)?
- [ ] **Type Safety:** Are there zero `any` types? Are all inputs validated with Zod?
- [ ] **Design Harmony:** Does the UI use the established color palette (`#090D16`, `#6366F1`, `#10B981`) and glassmorphic styling?
- [ ] **i18n Ready:** Are user-facing strings translated or mapped to dictionary keys?
