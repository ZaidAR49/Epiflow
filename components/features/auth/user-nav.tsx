"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  User,
  LogIn,
  Sliders,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";

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
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: `/${locale}/sign-in` });
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {isSignedIn && (
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-xs"
          title="Recruitment Intelligence Dashboard"
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span className="hidden sm:inline">{tCommon("dashboard")}</span>
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
            <span className="hidden md:inline">{tCommon("testBench")}</span>
          </Link>

          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors shadow-xs"
            title="Admin & Workflow Fleet Control"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{tCommon("admin")}</span>
          </Link>
        </div>
      )}

      {isSignedIn ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="group flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)]/60 ps-1.5 pe-2.5 py-1 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
            title="Account Menu"
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
            <ChevronDown className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180 text-[var(--accent)]" : ""}`} />
          </button>

          {/* Desktop User Dropdown Menu */}
          {isOpen && (
            <div
              className="absolute end-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              role="menu"
            >
              {/* User summary */}
              <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                <p className="text-xs font-bold text-[var(--text)] truncate">
                  {userName || "User"}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="capitalize">{userRole || "User"}</span>
                </p>
              </div>

              <Link
                href={`/${locale}/profile`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition-colors"
                role="menuitem"
              >
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span>{tCommon("profile")}</span>
              </Link>

              <Link
                href={`/${locale}/dashboard`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)] transition-colors"
                role="menuitem"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{tCommon("dashboard")}</span>
              </Link>

              {userRole === "admin" && (
                <Link
                  href={`/${locale}/admin`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                  role="menuitem"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{tCommon("admin")}</span>
                </Link>
              )}

              <div className="border-t border-[var(--border)] pt-1 mt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  role="menuitem"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>{tAuth("signOut")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
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
