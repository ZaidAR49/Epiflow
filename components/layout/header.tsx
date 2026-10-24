import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
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
   * When provided, rendered as a workflow breadcrumb item next to the EpiFlow platform logo.
   */
  logoUrl?: string | null;
  /**
   * Optional workflow name. Defaults to localized workflowName if logoUrl is provided.
   */
  workflowName?: string | null;
  /**
   * Target link destination for the workflow item (defaults to /dashboard).
   */
  workflowHref?: string;
  isSignedIn?: boolean;
  isSubscribed?: boolean;
}

export function Header({
  userRole,
  userName,
  userImage,
  logoUrl,
  workflowName,
  workflowHref,
  isSignedIn,
  isSubscribed = false,
}: HeaderProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();

  const displayWorkflowName = workflowName || (logoUrl ? t("workflowName") : null);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand & Breadcrumb Architecture (Apify / Vercel style) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* 1. EpiFlow Platform Logo - ALWAYS navigates to Platform Home */}
          <Link
            href={`/${locale}`}
            className="group/brand flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-95 focus:outline-none"
            title={`${t("platformName")} — ${t("home")}`}
          >
            <EpiFlowLogo variant="icon" height={36} glow />
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
                className="text-[var(--text-muted)]/40 text-base font-light select-none shrink-0"
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
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)] shadow-xs transition-transform duration-200 group-hover/wf:scale-105 group-hover/wf:border-[var(--accent)]/50">
                    <Image
                      src={logoUrl}
                      alt={displayWorkflowName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate transition-colors group-hover/wf:text-[var(--accent)]">
                    {displayWorkflowName}
                  </span>
                  <span className="hidden lg:inline-flex shrink-0 items-center rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] border border-[var(--accent)]/20">
                    Active
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Center Navigation Links (Apify style) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <Link
            href={`/${locale}#workflows`}
            className="rounded-lg px-3 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("workflows")}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="rounded-lg px-3 py-1.5 hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Desktop Actions: User & Localization */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <UserNav
            isSignedIn={isSignedIn}
            userName={userName}
            userRole={userRole}
            userImage={userImage}
            isSubscribed={isSubscribed}
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
            logoUrl={logoUrl}
            workflowName={displayWorkflowName}
          />
        </div>
      </div>
    </header>
  );
}
