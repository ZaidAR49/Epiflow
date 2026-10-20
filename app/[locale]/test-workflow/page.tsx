import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { getPrimaryWorkflow } from "@/lib/db/queries/workflows";
import { getUserById } from "@/lib/db/queries/users";
import { TestWorkflowView } from "@/components/features/test-bench/test-workflow-view";

interface TestWorkflowPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TestWorkflowPage({ params }: TestWorkflowPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await getUserById(session.user.id);
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/profile`);
  }

  const primaryWorkflow = await getPrimaryWorkflow();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        logoUrl={primaryWorkflow?.imageUrl}
        isSignedIn={Boolean(session?.user?.id)}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <TestWorkflowView
          workflowName={primaryWorkflow?.name || "JobPost X-Ray Bot"}
          avatarUrl={primaryWorkflow?.imageUrl}
        />
      </main>
    </div>
  );
}
