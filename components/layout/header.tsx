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
  logoUrl?: string | null;
  isSignedIn?: boolean;
}

export function Header({
  userRole,
  userName,
  userImage,
  logoUrl,
  isSignedIn,
}: HeaderProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link
          href={isSignedIn ? `/${locale}/dashboard` : `/${locale}`}
          className="group flex items-center gap-3 transition-opacity hover:opacity-95"
        >
          {logoUrl ? (
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] group-hover:scale-105 transition-transform duration-200">
              <Image
                src={logoUrl}
                alt={t("platformName")}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <EpiFlowLogo variant="icon" height={38} glow />
          )}
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[var(--text)]">
                {t("platformName")}
              </span>
              <span className="rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] border border-[var(--accent)]/20">
                {t("workflowName")}
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-medium text-[var(--text-muted)]">
              {t("tagline")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation: User & Localization */}
        <div className="hidden md:flex items-center gap-3">
          <UserNav
            isSignedIn={isSignedIn}
            userName={userName}
            userRole={userRole}
            userImage={userImage}
          />
          <div className="h-4 w-px bg-[var(--border)]" />
          <LocaleSwitcher />
        </div>

        {/* Mobile & Small Screens: Compact Locale + Burger Menu */}
        <div className="flex md:hidden items-center gap-2">
          <LocaleSwitcher />
          <MobileNav
            userRole={userRole}
            userName={userName}
            userImage={userImage}
            isSignedIn={isSignedIn}
          />
        </div>
      </div>
    </header>
  );
}
