import React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import { getUserWorkflowsList } from "@/lib/db/queries/workflows";
import { Header } from "@/components/layout/header";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { TelegramLinkCard } from "@/components/features/profile/telegram-link-card";
import { RegisteredWorkflowsCard } from "@/components/features/profile/registered-workflows-card";
import { AdminBanner } from "@/components/features/admin/admin-banner";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const workflows = await getUserWorkflowsList(user.id);
  const primaryLogoUrl = workflows.find((w) => w.slug === "job-xray")?.imageUrl || workflows[0]?.imageUrl;
  const t = await getTranslations("profile");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={user.role}
        userName={user.fullName}
        userImage={session.user.image}
        logoUrl={primaryLogoUrl}
        isSignedIn={Boolean(user.id)}
      />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <AdminBanner role={user.role} />

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column: User Profile & Registered Workflows */}
          <div className="lg:col-span-8 space-y-8">
            <ProfileForm
              initialData={{
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                image: session.user.image || user.image,
                role: user.role,
                status: user.status,
                preferredLanguage: (user.preferredLanguage as "ar" | "en") || "ar",
              }}
            />

            <RegisteredWorkflowsCard workflows={workflows} />
          </div>

          {/* Side Column: Telegram & Integrations */}
          <div className="lg:col-span-4 space-y-8">
            <TelegramLinkCard
              telegramId={user.telegramId}
              username={user.username}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
