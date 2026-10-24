import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getActiveWorkflows, getUserWorkflowsList } from "@/lib/db/queries/workflows";
import {
  HeroSection,
  WorkflowCatalog,
  PlatformPillars,
  CtaBanner,
} from "@/components/features/home";

export default async function MarketingPage() {
  const [session, workflows] = await Promise.all([
    auth(),
    getActiveWorkflows(),
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
      <Footer />
    </div>
  );
}
