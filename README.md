# ⚡ EpiFlow | JobPost X-Ray

> **Autonomous Multi-Stage Recruitment Intelligence & Outreach SaaS**  
> Dissect any LinkedIn post, verify hiring managers, cross-check company footprints, and stage 1-click personalized Gmail outreach drafts with attached CVs — via Web and Telegram.

---

## 🌟 Overview & Dual-Channel System

**EpiFlow** is a modern Next.js 16 SaaS platform orchestrating specialized, deterministic AI intelligence workflows. Its flagship workflow, **JobPost X-Ray**, replaces brittle automation tools and expensive subscriptions by transforming unstructured LinkedIn posts and `lnkd.in` shortlinks into verified candidate dossiers and automated outreach.

```mermaid
flowchart LR
    subgraph Channels["Client Channels"]
        Web["Web Dashboard<br/>(Next.js 16 / React 19)"]
        TG["Telegram Bot<br/>(Webhook & Poller)"]
    end

    subgraph Gatekeeper["Security & Gatekeeper"]
        Auth["Google OAuth / Auth.js"]
        Gate[("PostgreSQL Gatekeeper<br/>authenticate_gatekeeper")]
    end

    subgraph Background["Async Pipeline (Inngest)"]
        Scrape["Apify 3-Stage Scraper<br/>(Post → Recruiter → Company)"]
        AI["Vercel AI SDK<br/>(Gemini Flash + Claude Fallback)"]
        Guard["Code-Level Email Guard<br/>(Regex Source Verification)"]
    end

    subgraph Actions["Outreach & Delivery"]
        Draft["1-Click Gmail Draft<br/>(Attached CV from Drive)"]
        Curator["Community Formatter<br/>(Clean EN/AR Channel Post)"]
        DB[("Supabase / Drizzle<br/>consume_workflow_usage")]
    end

    Web & TG --> Auth & Gate
    Gate --> Background
    Background --> Scrape --> AI --> Guard
    Guard --> Draft & Curator --> DB
```

---

## 🚀 Complete Platform Functionalities

### 1. 3-Layer Recruitment Intelligence Pipeline
- **Layer 1: Role Overview & Requirements** — Extracts job title, seniority, core responsibilities, and separates mandatory requirements from preferred qualifications.
- **Layer 2: Recruiter Pedigree & Company Pulse** — Enriches the hiring manager's experience, tenure, and education. Smartly skips individual scraping if published by a company page. Pulls verified headcount, industry, and deduplicated global office locations.
- **Layer 3: Factual Diagnostics & Flags** — Cross-checks application email domain against official company websites to detect mismatches, flags role-to-industry discrepancies, and highlights missing critical fields.

### 2. Zero-Hallucination Email Guard & Gmail Composer
- **Strict Code-Level Verification** — An application email is accepted *only* if it literally appears in the raw post text and is explicitly designated as the application channel. Deterministic regex verification discards any LLM hallucinations.
- **1-Click Gmail Draft** — Uses the restricted `gmail.compose` scope to generate an outreach draft in the user's Gmail with their designated CV attached from Google Drive or storage. Never sends emails automatically.

### 3. Community Curator Mode (Telegram & Slack Admins)
- **Instant Channel Post Formatter** — Formats unstructured posts into structured, ready-to-publish Markdown briefs for Telegram, Slack, and Discord hiring communities.
- **Bilingual Clean Output** — Generates synchronized English and modern Arabic (RTL) templates with white-labeled formatting.

### 4. Dual-Channel Omnichannel Delivery
- **Web Dashboard** — Interactive URL scanner with paste detection, real-time status stepper, rich card report viewer, and analysis history (search, filter, delete, export JSON/Markdown).
- **Telegram Bot** — Paste links or `lnkd.in` shortlinks on mobile. Receives live status updates via `editMessageText`, rich Telegram Markdown reports, and inline interactive action buttons.
- **Cryptographic Account Linking** — Link Web accounts to Telegram via single-use 10-minute tokens (`/connect <TOKEN>`) or direct numeric ID pairing.

### 5. Multi-Tier Subscription & Billing Engine
- **Flexible Plans** — Free Starter (5 scans/mo, ad-supported), Job Seeker Pro ($5/mo, 100 scans, 1-click Gmail draft), and Community & Curator ($15/mo, 350 scans, channel formatter).
- **Billing Intervals** — Monthly, Yearly (20% discount), and Pay-As-You-Go credit packs.
- **Stripe & Mock Checkout** — Integrated webhook listener (`/api/billing/webhook`) and a development Mock Checkout provider for instant plan activation.
- **Dynamic Entitlements** — Per-workflow usage meters (`runs`, `ai_tokens`) managed via database RPCs (`apply_plan_entitlements`, `revoke_subscription_access`).

### 6. Platform Admin Center (`/admin`)
- **Fleet Telemetry** — Monitor active users, pending access requests, execution runs, and total quotas consumed.
- **Workflow Management** — Toggle workflow status (Active/Suspended), edit metadata, upload workflow banners to Supabase Storage, and configure external channels (Telegram bots, WhatsApp handles).
- **Plans & Pricing CRUD** — Create and edit subscription plans, billing intervals, prices, and JSONB entitlement limits.
- **User & Quota Administration** — Approve, reject, or lock accounts; adjust or reset quota meters; assign subscription plans; manage user roles (Admin/User).
- **Payments Ledger** — Immutable audit log of all transactions with real-time status filtering and search.
- **Usage Meters Catalog** — Define and register consumable metrics for workflow quota allocation.

### 7. Interactive Workflow Test Bench (`/test-workflow`)
- **Visual Node Graph Debugger** — Visualizes the execution graph with real-time node state inspection.
- **Node Inspector** — Inspect live input/output JSON, HTTP status, and millisecond execution times.
- **Live Terminal Logs** — Streams step-by-step diagnostic logs.
- **Instant Presets** — Test links with email, without email, direct company posts, or custom live URLs.

### 8. Native Bilingual & RTL-First Engine
- **Transcreated Copywriting** — Idiomatic modern SaaS Arabic (عربية فصحى معاصرة) tailored for the MENA job market rather than robotic machine translations.
- **RTL-First Styling** — Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`), mirrored directional icons, and Cairo typography.

---

## 🛠️ Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, Server Components) |
| **Language** | TypeScript (Strict mode, Zod validation at all boundaries) |
| **Styling** | Tailwind CSS v4, CSS Variables, Radix UI Primitives, Lucide Icons |
| **Internationalization** | `next-intl` (English & Arabic RTL) |
| **Database & ORM** | PostgreSQL (Supabase) via Drizzle ORM |
| **Authentication** | Auth.js / NextAuth (Google OAuth, encrypted refresh tokens) |
| **Orchestration** | Inngest background event-driven pipeline |
| **AI Models** | Vercel AI SDK: Google Gemini 2.0 Flash (Primary), Claude 3.5 Sonnet (Fallback) |
| **Scraping** | Apify Actors (Post, Author profile, Company profile) |
| **Storage & Email** | Supabase Storage (Images & CVs), Google Drive & Gmail API (`gmail.compose`) |
| **Logging & Monitoring** | Pino logger, structured error mapping via `AppError` |

---

## 🔐 Database & Gatekeeper Architecture

Access and quota consumption are enforced atomically in PostgreSQL:
1. `authenticate_gatekeeper(p_user_id / p_telegram_id, p_workflow_slug)`: Read-only access check enforcing account approval, workflow availability, grant validity, and quota availability.
2. `consume_workflow_usage(p_user_id, p_workflow_slug)`: Atomic guarded `UPDATE` executing **only after** a report has been successfully delivered. Failed runs never consume credits.

```
Gatekeeper Error Codes:
• UNREGISTERED (401)       • ACCOUNT_PENDING (403)    • ACCOUNT_REJECTED (403)
• ACCOUNT_LOCKED (423)     • WORKFLOW_FORBIDDEN (403) • WORKFLOW_DISABLED (503)
• ACCESS_EXPIRED (403)     • QUOTA_EXCEEDED (429)
```

---

## ⚙️ Quick Start & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/epiflow.git
cd epiflow
pnpm install # or npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and provide your API keys:
```bash
# Database & Auth
DATABASE_URL=postgresql://postgres:...@db.supabase.co:5432/postgres
AUTH_SECRET=your-random-32-character-secret
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret

# AI Models & Scraping
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
APIFY_API_TOKEN=your-apify-token

# Telegram & Storage
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret-token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Migration
Apply database migrations using Drizzle Kit:
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run Development Servers
```bash
# Start Next.js web application
pnpm dev

# In a separate terminal, run the Telegram development poller (optional)
pnpm bot:poll
```

---

## 📁 Repository Structure

```
app/
 ├── [locale]/
 │    ├── (marketing)/    # Landing page, workflow showcase, contact page
 │    ├── (auth)/         # Google OAuth sign-in flow
 │    ├── (app)/          # Protected: Dashboard, workflows console, profile, admin
 │    └── test-workflow/  # Interactive visual workflow test bench
 └── api/                 # Telegram webhook, inngest, billing, analyze, health
lib/
 ├── actions/             # Server actions (admin, analyze, profile, plans, telegram)
 ├── db/                  # Drizzle ORM schema, client connection, and queries
 ├── jobs/                # Inngest asynchronous job pipeline definitions
 └── services/            # Pure business logic (AI, Apify scraper, email, telegram)
messages/                 # Bilingual transcreated strings (en.json, ar.json)
```

---

## ⚖️ Legal & Privacy Disclaimer

Scraping LinkedIn data is subject to LinkedIn's Terms of Service and local data regulations. EpiFlow extracts only publicly visible data, enforces strict zero-hallucination contact verification, requires explicit user confirmation before staging email drafts, and never sends emails autonomously. Provided as-is.
