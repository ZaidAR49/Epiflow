import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { LocaleSwitcher } from "./locale-switcher";
import { UserNav } from "@/components/features/auth/user-nav";

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
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/80 font-bold text-white shadow-md shadow-[var(--accent)]/15 border border-[var(--border)] group-hover:scale-105 transition-transform duration-200">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={t("appName")}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="tracking-wider text-sm font-extrabold">XR</span>
            )}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-tight text-[var(--text)]">
              {t("appName")}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-medium text-[var(--text-muted)]">
              LinkedIn Job Intelligence
            </span>
          </div>
        </Link>

        {/* Right Nav: User & Localization */}
        <div className="flex items-center gap-3">
          <UserNav
            isSignedIn={isSignedIn}
            userName={userName}
            userRole={userRole}
            userImage={userImage}
          />
          <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
