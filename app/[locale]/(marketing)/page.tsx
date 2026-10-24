import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { getActiveWorkflows, getUserWorkflowsList } from "@/lib/db/queries/workflows";
import {
  HeroSection,
  WorkflowCatalog,
  PlatformPillars,
  CtaBanner,
} from "@/components/features/home";

interface MarketingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale } = await params;
  const [session, workflows, tCommon, tFooter] = await Promise.all([
    auth(),
    getActiveWorkflows(),
    getTranslations("common"),
    getTranslations("workflowLanding"),
  ]);

  const isSignedIn = Boolean(session?.user?.id);
  const userWorkflows = session?.user?.id
    ? await getUserWorkflowsList(session.user.id)
    : [];
  const subscribedSlugs = userWorkflows
    .filter((w) => w.isSubscribed)
    .map((w) => w.slug);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Platform Header */}
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        isSignedIn={isSignedIn}
        isSubscribed={session?.user?.isSubscribed}
      />

      <main className="flex-1">
        {/* EpiFlow Platform Hero */}
        <HeroSection isSignedIn={isSignedIn} />

        {/* Dynamic Workflow Catalog & Roadmap */}
        <WorkflowCatalog
          workflows={workflows}
          subscribedSlugs={subscribedSlugs}
        />

        {/* Core Architecture Pillars */}
        <PlatformPillars />

        {/* Call to Action Banner */}
        <CtaBanner isSignedIn={isSignedIn} />
      </main>

      {/* Platform Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10 text-xs text-[var(--text-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold tracking-tight text-sm text-[var(--text)]">
              EpiFlow
            </span>
            <span className="text-[var(--text-muted)]">
              {tFooter("footerCopyright")}
            </span>
            <span className="text-[var(--border)]">•</span>
            <Link
              href={`/${locale}/contact`}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline-offset-4 hover:underline"
            >
              {tCommon("contactUs")}
            </Link>
            <span className="text-[var(--border)]">•</span>
            <Link
              href={`/${locale}/privacy`}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline-offset-4 hover:underline"
            >
              {tCommon("privacyPolicy")}
            </Link>
            <span className="text-[var(--border)]">•</span>
            <Link
              href={`/${locale}/terms`}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline-offset-4 hover:underline"
            >
              {tCommon("termsOfService")}
            </Link>
          </div>

          <p className="text-center md:text-end text-[11px] text-[var(--text-muted)]/80 max-w-xl">
            {tFooter("footerDisclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
