import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { getWorkflowCredentialStatus } from "@/lib/db/queries/credentials";
import { Header } from "@/components/layout/header";
import { WorkflowConsoleView } from "@/components/features/workflow-console/workflow-console-view";

interface WorkflowConsolePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function WorkflowConsolePage({ params }: WorkflowConsolePageProps) {
  const { locale, slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const [workflow, initialCredential] = await Promise.all([
    getUserWorkflowDetails(session.user.id, slug),
    getWorkflowCredentialStatus(session.user.id, slug, "google"),
  ]);

  if (!workflow) {
    redirect(`/${locale}/profile`);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        logoUrl={workflow.imageUrl}
        workflowName={workflow.workflowName}
        workflowHref={`/${locale}/workflows/${slug}/console`}
        isSignedIn={Boolean(session?.user?.id)}
        isSubscribed={Boolean(workflow.isSubscribed ?? session?.user?.isSubscribed)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WorkflowConsoleView
          workflow={workflow}
          slug={slug}
          initialCredential={initialCredential}
        />
      </main>
    </div>
  );
}
