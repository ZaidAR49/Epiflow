import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { RefundView } from "@/components/features/legal";

interface RefundPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RefundPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "refund" });

  return {
    title: `${t("title")} — EpiFlow`,
    description: t("subtitle"),
  };
}

export default async function RefundPage() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        isSignedIn={isSignedIn}
        isSubscribed={session?.user?.isSubscribed}
      />

      <main className="flex-1">
        <RefundView />
      </main>

      <Footer />
    </div>
  );
}
