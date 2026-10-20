import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { getPrimaryWorkflow } from "@/lib/db/queries/workflows";
import { ArrowRight, Layers, UserCheck, Sparkles, Mail } from "lucide-react";

interface MarketingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale } = await params;
  const [session, t, tCommon, primaryWorkflow] = await Promise.all([
    auth(),
    getTranslations("landing"),
    getTranslations("common"),
    getPrimaryWorkflow(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        logoUrl={primaryWorkflow?.imageUrl}
        isSignedIn={Boolean(session?.user?.id)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-semibold text-[var(--accent)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{tCommon("tagline")}</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--text-muted)]">
              {t("heroSubtitle")}
            </p>

            {/* Live Paste Input Simulation / Action */}
            <div className="mx-auto mt-10 max-w-xl">
              <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl sm:flex-row">
                <input
                  type="text"
                  readOnly
                  placeholder={t("pasteDemo")}
                  className="flex-1 rounded-lg bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none"
                  value="https://www.linkedin.com/posts/acme-corp_hiring-lead-developer"
                />
                <Link
                  href={
                    session?.user?.id
                      ? `/${locale}/dashboard`
                      : `/${locale}/sign-in`
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow transition-colors hover:bg-[var(--accent)]/90"
                >
                  <span>{t("ctaButton")}</span>
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          </div>

          {/* Layered X-Ray Motif Visual */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[var(--danger)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--warn)]" />
                  <div className="h-3 w-3 rounded-full bg-[var(--success)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  JobPost X-Ray — Multi-Layer Inspection
                </span>
              </div>

              {/* Stacked Cards Preview */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-start">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-[var(--accent)]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[var(--text)]">
                    {t("step1Title")}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("step1Desc")}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-start">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-[var(--success)]">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[var(--text)]">
                    {t("step2Title")}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("step2Desc")}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-start">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[var(--text)]">
                    {t("step3Title")}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("step3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-6 text-center text-xs text-[var(--text-muted)]">
        <p>© {new Date().getFullYear()} JobPost X-Ray. All rights reserved.</p>
      </footer>
    </div>
  );
}
