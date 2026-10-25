"use client";

import React, { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertCircle, Save, Loader2, ShieldCheck, Mail, LogOut } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/profile";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ProfileFormProps {
  initialData: {
    id: string;
    fullName: string;
    email: string | null;
    image: string | null;
    role: "admin" | "editor" | "viewer" | "user" | "guest";
    status: "pending" | "approved" | "rejected" | "locked";
    preferredLanguage: "ar" | "en";
  };
  isSubscribed?: boolean;
  planCode?: string | null;
}

export function ProfileForm({
  initialData,
  isSubscribed = false,
  planCode,
}: ProfileFormProps) {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const toast = useToast();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [fullName, setFullName] = useState(initialData.fullName);
  const [preferredLanguage, setPreferredLanguage] = useState<"ar" | "en">(
    initialData.preferredLanguage
  );
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        preferredLanguage,
      });

      if (result.success) {
        setStatusMessage({ type: "success", text: t("saved") });
        toast.success(t("saved"));
      } else {
        setStatusMessage({ type: "error", text: result.message });
        toast.error(result.message);
      }
    });
  };

  const getStatusBadge = () => {
    switch (initialData.status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("statusApproved")}
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
            {t("statusPending")}
          </span>
        );
      case "locked":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 border border-rose-500/20">
            {t("statusLocked")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400 border border-slate-500/20">
            {t("statusRejected")}
          </span>
        );
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: `/${locale}/sign-in` });
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-4">
          <UserAvatar
            src={initialData.image}
            name={initialData.fullName}
            size="lg"
            isSubscribed={isSubscribed}
            planCode={planCode}
          />
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">{initialData.fullName}</h2>
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
              <Mail className="h-3.5 w-3.5" />
              <span dir="ltr">{initialData.email || "No email"}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 ms-1" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge()}
          <span className="rounded-md bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] border border-[var(--border)]">
            {initialData.role}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            title={tAuth("signOut")}
          >
            {isSigningOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span>{tAuth("signOut")}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text)] mb-1.5">
            {t("fullName")}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors"
          />
        </div>

        <div>
          <label htmlFor="preferredLanguage" className="block text-sm font-medium text-[var(--text)] mb-1.5">
            {t("preferredLanguage")}
          </label>
          <select
            id="preferredLanguage"
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as "ar" | "en")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden transition-colors"
          >
            <option value="ar">العربية (Arabic)</option>
            <option value="en">English (الإنجليزية)</option>
          </select>
        </div>

        {statusMessage && (
          <div
            className={`flex items-center gap-2.5 rounded-lg p-3 text-xs font-medium border ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{t("saveProfile")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
