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
import { AdminOverviewStats } from "@/components/features/admin/admin-overview-stats";
import { WorkflowManagementCard } from "@/components/features/admin/workflow-management-card";
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

  const [stats, workflows, users, channels] = await Promise.all([
    getAdminStats(),
    getAdminWorkflows(),
    getAdminUsers(),
    getAllWorkflowChannels(),
  ]);
  const primaryLogoUrl = workflows.find((w) => w.slug === "job-xray")?.imageUrl || workflows[0]?.imageUrl;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session.user.role}
        userName={session.user.name}
        userImage={session.user.image}
        logoUrl={primaryLogoUrl}
        isSignedIn={Boolean(session.user.id)}
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

      {/* Workflows & User Management Sections */}
      <div className="space-y-8">
        <WorkflowManagementCard workflows={workflows} channels={channels} />
        <UserManagementTable users={users} currentUserId={session.user.id} />
      </div>
    </main>
  </div>
  );
}
