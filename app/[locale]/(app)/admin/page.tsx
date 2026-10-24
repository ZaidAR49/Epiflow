import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
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
import { AdminOverviewStats } from "@/components/features/admin/admin-overview-stats";
import { WorkflowManagementCard } from "@/components/features/admin/workflow-management-card";
import { PlanManagementCard } from "@/components/features/admin/plan-management-card";
import { SubscriptionManagementCard } from "@/components/features/admin/subscription-management-card";
import { PaymentLedgerCard } from "@/components/features/admin/payment-ledger-card";
import { UsageMetersCard } from "@/components/features/admin/usage-meters-card";
import { UserManagementTable } from "@/components/features/admin/user-management-table";

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
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/profile`);
  }

  const t = await getTranslations("admin");

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
    workflows.find((w) => w.slug === "job-xray")?.imageUrl || workflows[0]?.imageUrl;

  const availableWorkflows = workflows.map((w) => ({ slug: w.slug, name: w.name }));

  const planOptions = plans.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    priceMinor: p.priceMinor,
    currency: p.currency,
  }));

  const userOptions = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        logoUrl={primaryLogoUrl}
        isSignedIn={Boolean(session.user.id)}
        isSubscribed={session.user.isSubscribed}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--accent)] border border-[var(--accent)]/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("badgeOwner")}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)] max-w-2xl">{t("subtitle")}</p>
          </div>

          <Link
            href={`/${locale}/profile`}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            <span>{t("backToProfile")}</span>
          </Link>
        </div>

        {/* Overview Analytics Strip */}
        <div className="mb-8">
          <AdminOverviewStats stats={stats} />
        </div>

        {/* Management Sections */}
        <div className="space-y-8">
          <PlanManagementCard
            plans={plans}
            availableWorkflows={availableWorkflows}
          />
          <SubscriptionManagementCard
            subscriptions={subscriptions}
            users={userOptions}
            plans={planOptions}
          />
          <PaymentLedgerCard payments={payments} stats={paymentStats} />
          <UsageMetersCard meters={usageMeters} />
          <WorkflowManagementCard workflows={workflows} channels={channels} />
          <UserManagementTable users={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
