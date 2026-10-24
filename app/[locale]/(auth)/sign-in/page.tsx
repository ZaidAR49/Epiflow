import React from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button";
import { Sparkles, Shield, Zap } from "lucide-react";

interface SignInPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const [t, tCommon] = await Promise.all([
    getTranslations("auth"),
    getTranslations("common"),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between">
      {/* Clean Platform Header without redundant sign-in button or workflow breadcrumb */}
      <Header hideAuthActions={true} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl backdrop-blur-md">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] font-bold text-white shadow-lg shadow-[var(--accent)]/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
              {t("signInTitle")}
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t("signInSubtitle")}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <GoogleSignInButton />

            <p className="text-center text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t("agreeNotice")}{" "}
              <Link
                href={`/${locale}/terms`}
                className="underline hover:text-[var(--accent)] transition-colors"
              >
                {tCommon("termsOfService")}
              </Link>{" "}
              {t("agreeAnd")}{" "}
              <Link
                href={`/${locale}/privacy`}
                className="underline hover:text-[var(--accent)] transition-colors"
              >
                {tCommon("privacyPolicy")}
              </Link>
              .
            </p>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t("googleOAuthOnly")}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{t("instantAccess")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
