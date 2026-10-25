import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDashboardSummary } from "@/lib/db/queries/dashboard";
import { Header } from "@/components/layout/header";
import { DashboardHub } from "@/components/features/dashboard/dashboard-hub";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const userId = session.user.id;
  const summary = await getDashboardSummary(userId);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        isSignedIn={Boolean(session?.user?.id)}
        isSubscribed={Boolean(session?.user?.isSubscribed)}
        planCode={session?.user?.planCode}
      />

      <main>
        <DashboardHub summary={summary} locale={locale} />
      </main>
    </div>
  );
}
