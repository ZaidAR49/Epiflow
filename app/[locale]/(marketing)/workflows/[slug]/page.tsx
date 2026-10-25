import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getWorkflowBySlug } from "@/lib/db/queries/workflows";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
import { getActivePlans } from "@/lib/db/queries/plans";
import { getUserSubscription } from "@/lib/db/queries/subscriptions";
import { WorkflowLandingView } from "@/components/features/workflow-landing";

interface WorkflowLandingPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: WorkflowLandingPageProps) {
  const { locale, slug } = await params;
  const [workflow, t] = await Promise.all([
    getWorkflowBySlug(slug),
    getTranslations({ locale, namespace: "workflowLanding" }),
  ]);

  if (!workflow) {
    return {
      title: t("workflowNotFound"),
    };
  }

  return {
    title: `${workflow.name} — ${t("heroTitleAccent")}`,
    description: t("heroSubtitle"),
  };
}

export default async function WorkflowLandingPage({
  params,
}: WorkflowLandingPageProps) {
  const { slug } = await params;
  const [session, workflow, plans] = await Promise.all([
    auth(),
    getWorkflowBySlug(slug),
    getActivePlans(),
  ]);

  if (!workflow || !workflow.isActive) {
    notFound();
  }

  const isAuthenticated = Boolean(session?.user?.id);
  let hasAccess = false;
  let currentPlanId: string | null = null;
  let currentPlanCode: string | null = null;

  if (session?.user?.id) {
    const [userWorkflow, subscription] = await Promise.all([
      getUserWorkflowDetails(session.user.id, slug),
      getUserSubscription(session.user.id),
    ]);
    hasAccess = Boolean(userWorkflow);
    currentPlanId = subscription?.planId ?? null;
    currentPlanCode = subscription?.planCode ?? null;
  }

  return (
    <WorkflowLandingView
      slug={slug}
      workflowName={workflow.name}
      imageUrl={workflow.imageUrl}
      hasAccess={hasAccess}
      isAuthenticated={isAuthenticated}
      plans={plans}
      currentPlanId={currentPlanId}
      currentPlanCode={currentPlanCode}
    />
  );
}
