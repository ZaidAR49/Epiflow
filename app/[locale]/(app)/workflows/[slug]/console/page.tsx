import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { getWorkflowCredentialStatus } from "@/lib/db/queries/credentials";
import { getUserTelegramIdentity } from "@/lib/db/queries/users";
import { getWorkflowChannelBySlug } from "@/lib/db/queries/workflow-channels";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { WorkflowConsoleView } from "@/components/features/workflow-console/workflow-console-view";
import { Shield } from "lucide-react";

interface WorkflowConsolePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function WorkflowConsolePage({ params }: WorkflowConsolePageProps) {
  const { locale, slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const [workflow, initialCredential, telegramIdentity, telegramChannel, tCommon] =
    await Promise.all([
      getUserWorkflowDetails(session.user.id, slug),
      getWorkflowCredentialStatus(session.user.id, slug, "google"),
      getUserTelegramIdentity(session.user.id),
      getWorkflowChannelBySlug(slug, "telegram"),
      getTranslations("common"),
    ]);

  if (!workflow) {
    redirect(`/${locale}/profile`);
  }

  const supportsTelegram = Boolean(telegramChannel || slug === "job-xray");

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
        planCode={session?.user?.planCode}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <WorkflowConsoleView
          workflow={workflow}
          slug={slug}
          initialCredential={initialCredential}
          telegramIdentity={telegramIdentity}
          supportsTelegram={supportsTelegram}
        />

        {slug === "job-xray" && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-4 py-3 text-center text-xs text-[var(--text-muted)]">
            <Shield className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
            <p>
              <strong className="text-[var(--text)]">{tCommon("legalNoticeTitle")}: </strong>
              {tCommon("linkedInDisclaimerNote")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
