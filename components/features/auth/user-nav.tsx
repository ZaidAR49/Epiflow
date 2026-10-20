"use client";

import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { User, LogIn, Sliders, ShieldCheck } from "lucide-react";

interface UserNavProps {
  userRole?: string;
  userName?: string | null;
  userImage?: string | null;
  isSignedIn?: boolean;
}

export function UserNav({
  userRole,
  userName,
  userImage,
  isSignedIn = false,
}: UserNavProps) {
  const locale = useLocale();
  const tAuth = useTranslations("auth");

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/${locale}/test-workflow`}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        <Sliders className="h-3.5 w-3.5" />
        <span>Test Bench</span>
      </Link>

      {userRole === "admin" && (
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors"
          title="Admin & Workflow Fleet Control"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Admin</span>
        </Link>
      )}

      {isSignedIn ? (
        <Link
          href={`/${locale}/profile`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          title="Profile & Settings"
        >
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName || "Profile"}
              className="h-4 w-4 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="h-3.5 w-3.5 text-[var(--accent)]" />
          )}
          <span className="hidden md:inline">{userName ? userName.split(" ")[0] : "Profile"}</span>
        </Link>
      ) : (
        <Link
          href={`/${locale}/sign-in`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 transition-colors"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>{tAuth("signInWithGoogle")}</span>
        </Link>
      )}
    </div>
  );
}
