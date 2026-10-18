# Antigravity Agent Workspace Rules

Please strictly read and follow all architectural, styling, file-size, and design pattern rules defined in [agent.md](file:///e:/projects/Linkedin-job-X-ray/agent.md).

Key Highlights:
1. **File Size Limit:** Every file must be strictly `< 300 lines`. Proactively break larger files into components and helper services.
2. **Layered Separation:**
   - Database operations must live exclusively in `lib/db/queries/`.
   - Server Actions are lightweight dispatchers (<200ms).
   - Scrapers, AI pipelines, and email composition live in dedicated `lib/` service modules.
3. **Design System & Aesthetics:**
   - Dark mode: Obsidian `#090D16`, Slate `#0F172A`, Indigo accent `#6366F1`, Emerald success `#10B981`.
   - Glassmorphism, subtle borders, modern typography (Inter/Plus Jakarta Sans for EN, Cairo for AR).
4. **Bilingual (English & Arabic) & RTL First:**
   - Always use CSS logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
   - Zero hardcoded directional values (`mr-*`, `ml-*`, `text-left`, `text-right`).
5. **Strict TypeScript & Zod:**
   - `"strict": true`, no `any` types.
   - All external payloads and AI outputs validated with Zod.
