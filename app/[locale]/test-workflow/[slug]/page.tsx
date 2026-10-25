import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { getWorkflowBySlug } from "@/lib/db/queries/workflows";
import { getUserById } from "@/lib/db/queries/users";
import { TestWorkflowView } from "@/components/features/test-bench/test-workflow-view";

interface TestWorkflowSlugPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function TestWorkflowSlugPage({ params }: TestWorkflowSlugPageProps) {
  const { locale, slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await getUserById(session.user.id);
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/profile`);
  }

  const workflow = await getWorkflowBySlug(slug);
  if (!workflow) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        logoUrl={workflow.imageUrl}
        workflowName={workflow.name}
        workflowHref={`/${locale}/test-workflow/${slug}`}
        isSignedIn={Boolean(session.user.id)}
        isSubscribed={session.user.isSubscribed}
        planCode={session.user.planCode}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <TestWorkflowView
          workflowName={workflow.name}
          avatarUrl={workflow.imageUrl}
        />
      </main>
    </div>
  );
}
