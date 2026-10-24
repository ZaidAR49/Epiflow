import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Header } from "@/components/layout/header";
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

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const [session, tCommon, tFooter] = await Promise.all([
    auth(),
    getTranslations("common"),
    getTranslations("workflowLanding"),
  ]);

  const isSignedIn = Boolean(session?.user?.id);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* Platform Header */}
      <Header
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userImage={session?.user?.image}
        isSignedIn={isSignedIn}
      />

      <main className="flex-1">
        <ContactView />
      </main>

      {/* Platform Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-10 text-xs text-[var(--text-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold tracking-tight text-sm text-[var(--text)]">
              EpiFlow
            </span>
            <span className="text-[var(--text-muted)]">
              {tFooter("footerCopyright")}
            </span>
            <span className="text-[var(--border)]">•</span>
            <Link
              href={`/${locale}/contact`}
              className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors underline-offset-4 hover:underline"
            >
              {tCommon("contactUs")}
            </Link>
          </div>

          <p className="text-center md:text-end text-[11px] text-[var(--text-muted)]/80 max-w-xl">
            {tFooter("footerDisclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
