"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { UserNav } from "@/components/features/auth/user-nav";
import { MobileNav } from "./mobile-nav";
import { EpiFlowLogo } from "@/components/ui/epiflow-logo";

interface HeaderProps {
  userRole?: string;
  userName?: string | null;
  userImage?: string | null;
  /**
   * Optional workflow logo/avatar URL.
   * Rendered as an avatar in the workflow breadcrumb item next to the EpiFlow logo.
   */
  logoUrl?: string | null;
  /**
   * Optional workflow name. When provided, renders breadcrumb item next to EpiFlow platform logo.
   */
  workflowName?: string | null;
  /**
   * Target link destination for the workflow item (defaults to /dashboard).
   */
  workflowHref?: string;
  isSignedIn?: boolean;
  isSubscribed?: boolean;
  planCode?: string | null;
  /**
   * When true (e.g. on /sign-in), suppresses redundant sign-in buttons in header.
   */
  hideAuthActions?: boolean;
  /**
   * Optional badge text rendered alongside the breadcrumb (e.g. "Platform Owner").
   */
  badgeText?: string | null;
  /**
   * Optional back link (e.g. "Return to Profile" on Admin page).
   */
  backLink?: {
    href: string;
    label: string;
  };
}

export function Header({
  userRole,
  userName,
  userImage,
  logoUrl,
  workflowName,
  workflowHref,
  isSignedIn = false,
  isSubscribed = false,
  planCode,
  hideAuthActions = false,
  badgeText,
  backLink,
}: HeaderProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();

  const displayWorkflowName = workflowName || null;
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand & Breadcrumb Architecture (Apify / Vercel style) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* 1. EpiFlow Platform Logo - ALWAYS navigates to Platform Home */}
          <Link
            href={`/${locale}`}
            className="group/brand flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-95 focus:outline-hidden"
            title={`${t("platformName")} — ${t("home")}`}
          >
            <EpiFlowLogo variant="icon" height={34} glow />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-extrabold tracking-tight text-[var(--text)] group-hover/brand:text-white transition-colors">
                {t("platformName")}
              </span>
              {!displayWorkflowName && (
                <span className="hidden sm:inline-block text-[10px] font-medium text-[var(--text-muted)]">
                  {t("tagline")}
                </span>
              )}
            </div>
          </Link>

          {/* 2. Workflow Context Breadcrumb (when inside a workflow context, e.g. JobPost X-Ray) */}
          {displayWorkflowName && (
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span
                className="text-[var(--border)] text-sm font-light select-none shrink-0"
                aria-hidden="true"
              >
                /
              </span>
              <Link
                href={workflowHref || (isSignedIn ? `/${locale}/dashboard` : `/${locale}`)}
                className="group/wf flex items-center gap-2 min-w-0 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--surface-2)]"
                title={displayWorkflowName}
              >
                {logoUrl && (
                  <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-2)] shadow-xs transition-transform duration-200 group-hover/wf:scale-105 group-hover/wf:border-[var(--accent)]/50">
                    <Image
                      src={logoUrl}
                      alt={displayWorkflowName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate transition-colors group-hover/wf:text-[var(--accent)]">
                  {displayWorkflowName}
                </span>
                {badgeText && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold text-[var(--accent)] border border-[var(--accent)]/30 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{badgeText}</span>
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>

        {/* Center Navigation Links (Clean SaaS style) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-xs font-semibold" aria-label="Main navigation">
          {([
            { href: `/${locale}#workflows`, label: t("workflows") },
            { href: `/${locale}#pillars`, label: t("architecture") },
            { href: `/${locale}/contact`, label: t("contact") },
            ...(isSignedIn ? [{ href: `/${locale}/dashboard`, label: t("dashboard") }] : []),
            ...(userRole === "admin" ? [{ href: `/${locale}/admin`, label: t("admin") }] : []),
          ] as { href: string; label: string }[]).map(({ href, label }) => {
            const segment = href.split("#")[0] ?? "";
            const isActive = segment.length > 3 && pathname === segment;
            return (
              <Link
                key={href}
                href={href}
                className={`relative rounded-lg px-3 py-1.5 transition-colors group ${
                  isActive
                    ? "text-[var(--accent)] bg-[var(--accent)]/10"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0.5 start-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-[var(--accent)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions: Back link + User & Localization */}
        <div className="hidden md:flex items-center gap-2.5 sm:gap-3 shrink-0">
          {backLink && (
            <Link
              href={backLink.href}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70 px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] hover:border-[var(--accent)]/40 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
              <span>{backLink.label}</span>
            </Link>
          )}
          <UserNav
            isSignedIn={isSignedIn}
            userName={userName}
            userRole={userRole}
            userImage={userImage}
            isSubscribed={isSubscribed}
            planCode={planCode}
            hideAuthActions={hideAuthActions}
          />
          <div className="h-4 w-px bg-[var(--border)]" />
          <LocaleSwitcher />
        </div>

        {/* Mobile & Small Screens: Compact Locale + Burger Menu */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <LocaleSwitcher />
          <MobileNav
            userRole={userRole}
            userName={userName}
            userImage={userImage}
            isSignedIn={isSignedIn}
            isSubscribed={isSubscribed}
            planCode={planCode}
            logoUrl={logoUrl}
            workflowName={displayWorkflowName}
            hideAuthActions={hideAuthActions}
          />
        </div>
      </div>
    </header>
  );
}
