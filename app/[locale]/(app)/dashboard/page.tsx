import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { getRecentRunsForUser } from "@/lib/db/queries/job-runs";
import { getPrimaryWorkflow } from "@/lib/db/queries/workflows";
import { Header } from "@/components/layout/header";
import { DashboardView } from "@/components/features/dashboard/dashboard-view";

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

  const [workflow, runs, primaryWorkflow] = await Promise.all([
    getUserWorkflowDetails(userId, "job-xray"),
    getRecentRunsForUser(userId, 50),
    getPrimaryWorkflow(),
  ]);

  const remainingQuota =
    workflow?.usageLimit !== null && workflow?.usageLimit !== undefined
      ? Math.max(0, workflow.usageLimit - workflow.usageCount)
      : null;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        logoUrl={primaryWorkflow?.imageUrl || workflow?.imageUrl}
        isSignedIn={Boolean(session?.user?.id)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardView
          initialRuns={runs}
          initialQuota={remainingQuota}
          preferredLanguage={workflow?.metadata?.preferred_language || "ar"}
          initialSelectedRunId={initialSelectedRunId}
        />
      </main>
    </div>
  );
}
