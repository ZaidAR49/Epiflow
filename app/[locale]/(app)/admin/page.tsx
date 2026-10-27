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
import { getAllAnnouncements } from "@/lib/db/queries/system-announcements";
import { AdminShell } from "@/components/features/admin/admin-shell";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";

const getCachedStats = unstable_cache(getAdminStats, ["admin-stats"], { revalidate: 30 });
const getCachedWorkflows = unstable_cache(getAdminWorkflows, ["admin-workflows"], { revalidate: 30 });
const getCachedUsers = unstable_cache(getAdminUsers, ["admin-users"], { revalidate: 20 });
const getCachedPlans = unstable_cache(getAllPlans, ["admin-plans"], { revalidate: 30 });
const getCachedSubscriptions = unstable_cache(getAllSubscriptions, ["admin-subscriptions"], { revalidate: 20 });
const getCachedPayments = unstable_cache(getAllPayments, ["admin-payments"], { revalidate: 20 });
const getCachedPaymentStats = unstable_cache(getPaymentStats, ["admin-payment-stats"], { revalidate: 20 });
const getCachedUsageMeters = unstable_cache(getAllUsageMeters, ["admin-usage-meters"], { revalidate: 30 });
const getCachedChannels = unstable_cache(getAllWorkflowChannels, ["admin-channels"], { revalidate: 30 });
const getCachedAnnouncements = unstable_cache(getAllAnnouncements, ["admin-announcements"], { revalidate: 30 });

interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

async function resilientQuery<T>(fn: () => Promise<T>, fallback: T, name: string): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    logger.warn({ err: firstErr, query: name }, "Transient query failure, retrying once...");
    try {
      return await fn();
    } catch (secondErr) {
      logger.error({ err: secondErr, query: name }, "Query failed after retry, using fallback");
      return fallback;
    }
  }
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await resilientQuery(
    () => getUserById(session.user.id),
    null,
    "getUserById"
  );

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
    announcements,
  ] = await Promise.all([
    resilientQuery(
      getCachedStats,
      { totalUsers: 0, pendingUsers: 0, totalWorkflows: 0, activeWorkflows: 0, totalRuns: 0, totalQuotaConsumed: 0 },
      "getAdminStats"
    ),
    resilientQuery(getCachedWorkflows, [], "getAdminWorkflows"),
    resilientQuery(getCachedUsers, [], "getAdminUsers"),
    resilientQuery(getCachedChannels, [], "getAllWorkflowChannels"),
    resilientQuery(getCachedPlans, [], "getAllPlans"),
    resilientQuery(getCachedSubscriptions, [], "getAllSubscriptions"),
    resilientQuery(getCachedPayments, [], "getAllPayments"),
    resilientQuery(
      getCachedPaymentStats,
      { totalVolumeMinor: 0, totalCount: 0, succeededCount: 0, refundedCount: 0 },
      "getPaymentStats"
    ),
    resilientQuery(getCachedUsageMeters, [], "getAllUsageMeters"),
    resilientQuery(getCachedAnnouncements, [], "getAllAnnouncements"),
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
        announcements={announcements}
        currentUserId={session.user.id}
        callerRole={user.role}
      />
    </div>
  );
}