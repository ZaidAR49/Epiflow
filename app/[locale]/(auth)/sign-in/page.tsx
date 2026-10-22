import React from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { getPrimaryWorkflow } from "@/lib/db/queries/workflows";
import { GoogleSignInButton } from "@/components/features/auth/google-sign-in-button";
import { Sparkles, Shield, Zap } from "lucide-react";

export default async function SignInPage() {
  const [t, primaryWorkflow] = await Promise.all([
    getTranslations("auth"),
    getPrimaryWorkflow(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between">
      <Header logoUrl={primaryWorkflow?.imageUrl} />

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

          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span>Google OAuth Only</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-muted)]">
        EpiFlow &copy; {new Date().getFullYear()} — Secure Intelligence Platform
      </footer>
    </div>
  );
}
