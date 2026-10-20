import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { UserNav } from "@/components/features/auth/user-nav";

interface HeaderProps {
  userRole?: string;
  userName?: string | null;
  userImage?: string | null;
  isSignedIn?: boolean;
}

export function Header({ userRole, userName, userImage, isSignedIn }: HeaderProps = {}) {
  const t = useTranslations("common");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-white shadow-sm">
            XR
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--text)]">
            {t("appName")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <UserNav
            isSignedIn={isSignedIn}
            userName={userName}
            userRole={userRole}
            userImage={userImage}
          />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
