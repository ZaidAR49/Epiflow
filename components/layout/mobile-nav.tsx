"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Menu,
  Home,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Globe,
  Mail,
} from "lucide-react";
import Image from "next/image";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";
import { UserAvatar } from "@/components/ui/user-avatar";

interface MobileNavProps {
  userRole?: string;
  userName?: string | null;
  userImage?: string | null;
  isSignedIn?: boolean;
  isSubscribed?: boolean;
  planCode?: string | null;
  logoUrl?: string | null;
  workflowName?: string | null;
  hideAuthActions?: boolean;
}

export function MobileNav({
  userRole,
  userName,
  userImage,
  isSignedIn = false,
  isSubscribed = false,
  planCode,
  logoUrl,
  workflowName,
  hideAuthActions = false,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    const segments = pathname.split("/");
    if (segments[1] === "en" || segments[1] === "ar") {
      segments[1] = nextLocale;
    } else {
      segments.unshift("", nextLocale);
    }
    const search = typeof window !== "undefined" ? window.location.search : "";
    const newPath = (segments.join("/") || `/${nextLocale}`) + search;
    window.location.href = newPath;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("menu")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/80 text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="end" className="flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {isSignedIn ? (
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={userImage}
                    name={userName}
                    size="md"
                    isSubscribed={isSubscribed}
                    planCode={planCode}
                  />
                  <div className="flex flex-col text-start">
                    <span className="text-sm font-bold text-[var(--text)]">
                      {userName || "User"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {userRole === "admin" && (
                        <span className="text-[10px] font-semibold text-emerald-400">
                          {t("admin")}
                        </span>
                      )}
                      {isSubscribed && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold border ${
                            planCode && (planCode.toLowerCase() === "business" || planCode.toLowerCase().includes("business"))
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                          }`}
                        >
                          {planCode && (planCode.toLowerCase() === "business" || planCode.toLowerCase().includes("business"))
                            ? "Business"
                            : "Pro"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <EpiFlowLogo variant="icon" height={28} />
                  <span className="text-base font-extrabold tracking-tight text-[var(--text)]">
                    {t("appName")}
                  </span>
                </div>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("navigation")}
            </SheetDescription>
          </SheetHeader>

          {/* Active Workflow Context (if present) */}
          {workflowName && (
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2.5">
              {logoUrl ? (
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                  <Image
                    src={logoUrl}
                    alt={workflowName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <EpiFlowLogo variant="icon" height={28} />
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--text)] truncate">
                  {workflowName}
                </span>
                <span className="text-[10px] text-[var(--accent)] font-semibold">
                  Active Workflow
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-1.5">
            {[
              { href: `/${locale}`, label: t("home"), icon: Home, color: "text-emerald-400" },
              { href: `/${locale}#workflows`, label: t("workflows"), icon: Layers, color: "text-purple-400" },
              ...(isSignedIn ? [{ href: `/${locale}/dashboard`, label: t("dashboard"), icon: LayoutDashboard, color: "text-[var(--accent)]" }] : []),
              ...(userRole === "admin" ? [
                { href: `/${locale}/admin`, label: t("admin"), icon: ShieldCheck, color: "text-[var(--accent)]", highlight: true },
              ] : []),
              ...(isSignedIn ? [{ href: `/${locale}/profile`, label: t("profile"), icon: User, color: "text-emerald-400" }] : []),
              { href: `/${locale}/contact`, label: t("contact"), icon: Mail, color: "text-indigo-400" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                    item.highlight
                      ? "text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20"
                      : "text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[var(--border)] pt-4 space-y-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--accent)]" />
              <span>{t("language")}</span>
            </span>
            <span className="font-bold text-[var(--accent)]">
              {locale === "en" ? "العربية" : "English"}
            </span>
          </button>

          {isSignedIn ? (
            <Link
              href={`/${locale}/sign-in`}
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{tAuth("signOut")}</span>
            </Link>
          ) : hideAuthActions ? null : (
            <Link
              href={`/${locale}/sign-in`}
              onClick={() => setOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>{t("signIn")}</span>
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
