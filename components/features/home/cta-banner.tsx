import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";

interface CtaBannerProps {
  isSignedIn?: boolean;
}

export function CtaBanner({ isSignedIn = false }: CtaBannerProps) {
  const t = useTranslations("landing");
  const locale = useLocale();

  return (
    <section className="py-16 sm:py-24 border-t border-[var(--border)]/70 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-purple-600/10 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 p-8 sm:p-12 shadow-2xl backdrop-blur-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-1 text-xs font-semibold text-purple-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>EpiFlow Automation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] max-w-2xl mx-auto">
            {t("ctaTitle")}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            {t("ctaSubtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#workflows"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:scale-[1.02] transition-transform"
            >
              <span>{t("ctaExplore")}</span>
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </a>

            <Link
              href={isSignedIn ? `/${locale}/dashboard` : `/${locale}/sign-in`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-6 py-3.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-colors"
            >
              <span>{t("ctaStartFree")}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
