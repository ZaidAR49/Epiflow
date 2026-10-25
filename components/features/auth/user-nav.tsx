"use client";

import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LogIn } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface UserNavProps {
  userRole?: string;
  userName?: string | null;
  userImage?: string | null;
  isSignedIn?: boolean;
  isSubscribed?: boolean;
  planCode?: string | null;
  hideAuthActions?: boolean;
}

export function UserNav({
  userRole,
  userName,
  userImage,
  isSignedIn = false,
  isSubscribed = false,
  planCode,
  hideAuthActions = false,
}: UserNavProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");

  const isBusiness = Boolean(
    isSubscribed &&
      planCode &&
      (planCode.toLowerCase() === "business" ||
        planCode.toLowerCase().includes("business"))
  );

  return (
    <div className="flex items-center gap-2.5">
      {isSignedIn ? (
        /* ── Direct User Profile Link (no dropdown needed; redundant options live in main nav) ── */
        <Link
          href={`/${locale}/profile`}
          className="group flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 ps-1.5 pe-3 py-1 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
          title={tCommon("profile")}
        >
          <UserAvatar
            src={userImage}
            name={userName}
            size="sm"
            isSubscribed={isSubscribed}
            planCode={planCode}
          />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
              {userName ? userName.split(" ")[0] : tCommon("profile")}
            </span>
            {isSubscribed ? (
              <span className={`text-[9px] font-bold ${isBusiness ? "text-amber-400" : "text-sky-400"}`}>
                {isBusiness ? "Business" : "Pro Member"}
              </span>
            ) : userRole === "admin" ? (
              <span className="text-[9px] font-semibold text-emerald-400">Admin</span>
            ) : null}
          </div>
        </Link>
      ) : hideAuthActions ? null : (
        /* ── Sign-in buttons (unauthenticated) ── */
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={`/${locale}/sign-in`}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {tCommon("signIn")}
          </Link>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-all"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{tCommon("getStarted")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
