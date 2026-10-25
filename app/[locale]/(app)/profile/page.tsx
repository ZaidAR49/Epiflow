import React from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import { getUserSubscription } from "@/lib/db/queries/subscriptions";
import { getAllPlans } from "@/lib/db/queries/plans";
import { Header } from "@/components/layout/header";
import {
  ProfileForm,
  UserSubscriptionCard,
} from "@/components/features/profile";
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

  const [subscription, allPlans] = await Promise.all([
    getUserSubscription(user.id),
    getAllPlans(),
  ]);

  const t = await getTranslations("profile");

  const isSubscribed = Boolean(
    subscription &&
      (subscription.status === "active" || subscription.status === "trialing") &&
      subscription.planPriceMinor > 0
  );
  const planCode = isSubscribed ? subscription?.planCode : undefined;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={user.role}
        userName={user.fullName}
        userImage={session.user.image}
        isSignedIn={Boolean(user.id)}
        isSubscribed={isSubscribed}
        planCode={planCode}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <AdminBanner role={user.role} />

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: User Profile */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            <ProfileForm
              initialData={{
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                image: session.user.image || null,
                role: user.role,
                status: user.status,
                preferredLanguage: (user.preferredLanguage as "ar" | "en") || "ar",
              }}
              isSubscribed={isSubscribed}
              planCode={planCode}
            />
          </div>

          {/* Side Column: Subscription */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            <UserSubscriptionCard
              subscription={subscription}
              availablePlans={allPlans}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
