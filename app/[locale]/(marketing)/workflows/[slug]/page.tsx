import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getWorkflowBySlug } from "@/lib/db/queries/workflows";
import { getUserWorkflowDetails } from "@/lib/db/queries/access";
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
  const [session, workflow] = await Promise.all([
    auth(),
    getWorkflowBySlug(slug),
  ]);

  if (!workflow || !workflow.isActive) {
    notFound();
  }

  const isAuthenticated = Boolean(session?.user?.id);
  let hasAccess = false;
  if (session?.user?.id) {
    const userWorkflow = await getUserWorkflowDetails(session.user.id, slug);
    hasAccess = Boolean(userWorkflow);
  }

  return (
    <WorkflowLandingView
      slug={slug}
      workflowName={workflow.name}
      imageUrl={workflow.imageUrl}
      hasAccess={hasAccess}
      isAuthenticated={isAuthenticated}
    />
  );
}
