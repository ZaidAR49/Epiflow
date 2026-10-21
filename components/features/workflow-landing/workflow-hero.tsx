"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  UserCheck,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface WorkflowHeroProps {
  slug: string;
  hasAccess?: boolean;
}

export function WorkflowHero({ slug, hasAccess }: WorkflowHeroProps) {
  const t = useTranslations("workflowLanding");
  const locale = useLocale();

  const [demoUrl, setDemoUrl] = useState(
    "https://www.linkedin.com/posts/acme-corp_hiring-senior-backend-engineer-lead"
  );
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 border-b border-[var(--border)]">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-0 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 h-[420px] w-full max-w-5xl bg-gradient-to-b from-[var(--accent)]/15 via-transparent to-transparent blur-3xl -z-10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--surface-2)]/80 px-4 py-1.5 text-xs font-semibold text-[var(--accent)] shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{t("badge")}</span>
          </div>

          {/* Main Title */}
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl sm:leading-[1.15]">
            {t("heroTitle")}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-[var(--text-muted)] sm:text-lg leading-relaxed">
            {t("heroSubtitle")}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {hasAccess ? (
              <Link
                href={`/${locale}/workflows/${slug}/console`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 hover:scale-[1.02]"
              >
                <span>{t("launchConsole")}</span>
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            ) : (
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all hover:bg-[var(--accent)]/90 hover:scale-[1.02]"
              >
                <span>{t("subscribeNow")}</span>
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </a>
            )}

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/70 px-6 py-3.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/40"
            >
              <span>{t("tryFreeScan")}</span>
              <ExternalLink className="h-4 w-4 text-[var(--text-muted)]" />
            </a>
          </div>

          {/* Live Paste Simulator Bar */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-2xl sm:flex-row">
              <input
                type="text"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder={t("pasteDemoPlaceholder")}
                className="flex-1 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-xs sm:text-sm text-[var(--text)] outline-none border border-transparent focus:border-[var(--accent)]/40 font-mono transition-colors"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setActiveLayer(activeLayer === null ? 0 : null)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[var(--accent)]/90 shrink-0"
              >
                <Zap className="h-4 w-4" />
                <span>{t("demoSampleBtn")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Layered X-Ray Motif Live Inspection Preview */}
        <div className="mx-auto mt-14 max-w-5xl">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 shadow-2xl backdrop-blur-md">
            {/* Header with status lights */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[var(--danger)]" />
                <div className="h-3 w-3 rounded-full bg-[var(--warn)]" />
                <div className="h-3 w-3 rounded-full bg-[var(--success)]" />
                <span className="ms-2 font-mono text-xs font-medium text-[var(--text-muted)]">
                  {t("previewPostHeader")}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t("statZeroHallucinationLabel")}</span>
              </div>
            </div>

            {/* 3 Layered Cards Stack */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Layer 1: Post Analysis */}
              <div
                onClick={() => setActiveLayer(0)}
                className={`cursor-pointer rounded-xl border p-5 transition-all text-start flex flex-col justify-between ${
                  activeLayer === 0
                    ? "border-[var(--accent)] bg-[var(--surface-2)] shadow-lg shadow-[var(--accent)]/10 scale-[1.01]"
                    : "border-[var(--border)] bg-[var(--surface-2)]/70 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-[var(--accent)] border border-indigo-500/20">
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      {t("previewLayer1Tag")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text)]">
                    {t("previewLayer1Title")}
                  </h3>
                  <p className="mt-1 font-medium text-xs text-[var(--accent)]">
                    {t("previewLayer1Subtitle")}
                  </p>
                  <p className="mt-2.5 text-xs text-[var(--text-muted)] leading-relaxed">
                    {t("previewLayer1Desc")}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Salary: $140k–$170k</span>
                </div>
              </div>

              {/* Layer 2: Recruiter Pedigree */}
              <div
                onClick={() => setActiveLayer(1)}
                className={`cursor-pointer rounded-xl border p-5 transition-all text-start flex flex-col justify-between ${
                  activeLayer === 1
                    ? "border-[var(--accent)] bg-[var(--surface-2)] shadow-lg shadow-[var(--accent)]/10 scale-[1.01]"
                    : "border-[var(--border)] bg-[var(--surface-2)]/70 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-[var(--success)] border border-emerald-500/20">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                      {t("previewLayer2Tag")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text)]">
                    {t("previewLayer2Title")}
                  </h3>
                  <p className="mt-1 font-medium text-xs text-emerald-400">
                    {t("previewLayer2Subtitle")}
                  </p>
                  <p className="mt-2.5 text-xs text-[var(--text-muted)] leading-relaxed">
                    {t("previewLayer2Desc")}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Tenure: 3.5 yrs (Hiring Lead)</span>
                </div>
              </div>

              {/* Layer 3: Company & Direct Outreach */}
              <div
                onClick={() => setActiveLayer(2)}
                className={`cursor-pointer rounded-xl border p-5 transition-all text-start flex flex-col justify-between ${
                  activeLayer === 2
                    ? "border-[var(--accent)] bg-[var(--surface-2)] shadow-lg shadow-[var(--accent)]/10 scale-[1.01]"
                    : "border-[var(--border)] bg-[var(--surface-2)]/70 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-2)]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                      {t("previewLayer3Tag")}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text)]">
                    {t("previewLayer3Title")}
                  </h3>
                  <div className="mt-2 inline-block rounded-lg bg-[var(--bg)] px-3 py-1 font-mono text-xs font-semibold text-purple-300 border border-[var(--border)]" dir="ltr">
                    careers@acme-corp.com
                  </div>
                  <p className="mt-2.5 text-xs text-[var(--text-muted)] leading-relaxed">
                    {t("previewLayer3Subtitle")}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border)]">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{t("previewLayer3Cta")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Stat Ticker Strip */}
        <div className="mx-auto mt-12 max-w-5xl grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <div className="text-2xl font-extrabold text-[var(--text)]" dir="ltr">
              {t("statPostsAnalyzed")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("statPostsAnalyzedLabel")}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <div className="text-2xl font-extrabold text-[var(--accent)]" dir="ltr">
              {t("statOutreachVelocity")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("statOutreachVelocityLabel")}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <div className="text-2xl font-extrabold text-emerald-400" dir="ltr">
              {t("statZeroHallucination")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("statZeroHallucinationLabel")}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <div className="text-2xl font-extrabold text-purple-400">
              {t("statOmnichannel")}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {t("statOmnichannelLabel")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
