import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getUserById } from "@/lib/db/queries/users";
import {
  getAdminStats,
  getAdminWorkflows,
  getAdminUsers,
} from "@/lib/db/queries/admin";
import { getAllWorkflowChannels } from "@/lib/db/queries/workflow-channels";
import { getAllPlans } from "@/lib/db/queries/plans";
import { getAllSubscriptions } from "@/lib/db/queries/subscriptions";
import { getAllPayments, getPaymentStats } from "@/lib/db/queries/payments";
import { getAllUsageMeters } from "@/lib/db/queries/usage-meters";
import { AdminShell } from "@/components/features/admin/admin-shell";

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await getUserById(session.user.id);
  if (
    !user ||
    (user.role !== "admin" && user.role !== "editor" && user.role !== "viewer")
  ) {
    redirect(`/${locale}/profile`);
  }

  const [
    stats,
    workflows,
    users,
    channels,
    plans,
    subscriptions,
    payments,
    paymentStats,
    usageMeters,
  ] = await Promise.all([
    getAdminStats(),
    getAdminWorkflows(),
    getAdminUsers(),
    getAllWorkflowChannels(),
    getAllPlans(),
    getAllSubscriptions(),
    getAllPayments(),
    getPaymentStats(),
    getAllUsageMeters(),
  ]);

  const primaryLogoUrl =
    workflows.find((w) => w.slug === "job-xray")?.imageUrl ?? workflows[0]?.imageUrl;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Header
        userRole={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        logoUrl={primaryLogoUrl}
        isSignedIn={Boolean(session.user.id)}
        isSubscribed={session.user.isSubscribed}
        planCode={session.user.planCode}
      />

      <AdminShell
        stats={stats}
        workflows={workflows}
        users={users}
        channels={channels}
        plans={plans}
        subscriptions={subscriptions}
        payments={payments}
        paymentStats={paymentStats}
        usageMeters={usageMeters}
        currentUserId={session.user.id}
        callerRole={user.role}
      />
    </div>
  );
}