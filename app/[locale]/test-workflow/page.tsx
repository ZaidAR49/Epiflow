import { redirect } from "next/navigation";

interface TestWorkflowPageProps {
  params: Promise<{ locale: string }>;
}

// Legacy route — redirect to the slug-based route
export default async function TestWorkflowPage({ params }: TestWorkflowPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/test-workflow/job-xray`);
}
