import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TermsView } from "@/components/features/legal";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return {
    title: `${t("title")} — EpiFlow`,
    description: t("subtitle"),
  };
}

export default async function TermsPage() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);

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
        <TermsView />
      </main>

      {/* Platform Footer */}
      <Footer />
    </div>
  );
}
