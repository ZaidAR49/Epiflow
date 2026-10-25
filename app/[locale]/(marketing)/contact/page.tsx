import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactView } from "@/components/features/contact";

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("title")} — EpiFlow`,
    description: t("subtitle"),
  };
}

export default async function ContactPage() {
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
        planCode={session?.user?.planCode}
      />

      <main className="flex-1">
        <ContactView />
      </main>

      {/* Platform Footer */}
      <Footer />
    </div>
  );
}
