"use client";

import React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { User, LogIn, Sliders, ShieldCheck, LayoutDashboard } from "lucide-react";

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
    <div className="flex items-center gap-2.5">
      {isSignedIn && (
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-xs"
          title="Recruitment Intelligence Dashboard"
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      )}

      {userRole === "admin" && (
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/test-workflow`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors shadow-xs"
            title="Interactive Testing Lab"
          >
            <Sliders className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="hidden md:inline">Test Bench</span>
          </Link>

          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors shadow-xs"
            title="Admin & Workflow Fleet Control"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      )}

      {isSignedIn ? (
        <Link
          href={`/${locale}/profile`}
          className="group flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 ps-1.5 pe-3.5 py-1 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-all shadow-xs"
          title="Profile & Settings"
        >
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[var(--accent)]/30 bg-[var(--surface)] border border-[var(--border)]">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={userName || "User"}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-3.5 w-3.5 text-[var(--accent)]" />
            )}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
              {userName ? userName.split(" ")[0] : "Profile"}
            </span>
            {userRole === "admin" && (
              <span className="text-[9px] font-semibold text-emerald-400">
                Admin
              </span>
            )}
          </div>
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
