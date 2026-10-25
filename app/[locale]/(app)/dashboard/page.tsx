import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { getRecentRunsForUser } from "@/lib/db/queries/job-runs";
import { getPrimaryWorkflow } from "@/lib/db/queries/workflows";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { DashboardView } from "@/components/features/dashboard/dashboard-view";
import { Shield } from "lucide-react";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ runId?: string }>;
}

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSelectedRunId = resolvedSearchParams?.runId;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const userId = session.user.id;

  const [workflow, runs, primaryWorkflow, t] = await Promise.all([
    getUserWorkflowDetails(userId, "job-xray"),
    getRecentRunsForUser(userId, 50),
    getPrimaryWorkflow(),
    getTranslations("common"),
  ]);

  const remainingQuota =
    workflow?.usageLimit !== null && workflow?.usageLimit !== undefined
      ? Math.max(0, workflow.usageLimit - workflow.usageCount)
      : null;

  const isSubscribed = Boolean(workflow?.isSubscribed ?? session?.user?.isSubscribed);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        logoUrl={primaryWorkflow?.imageUrl || workflow?.imageUrl}
        workflowName={workflow?.workflowName || primaryWorkflow?.name || "JobPost X-Ray"}
        workflowHref={`/${locale}/dashboard`}
        isSignedIn={Boolean(session?.user?.id)}
        isSubscribed={isSubscribed}
        planCode={session?.user?.planCode}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <DashboardView
          initialRuns={runs}
          initialQuota={remainingQuota}
          preferredLanguage={workflow?.metadata?.preferred_language || "ar"}
          initialSelectedRunId={initialSelectedRunId}
          isSubscribed={isSubscribed}
        />

        {/* Workflow-Specific Legal & Trademark Notice */}
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-4 py-3 text-center text-xs text-[var(--text-muted)]">
          <Shield className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
          <p>
            <strong className="text-[var(--text)]">{t("legalNoticeTitle")}: </strong>
            {t("linkedInDisclaimerNote")}
          </p>
        </div>
      </main>
    </div>
  );
}
