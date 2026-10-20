import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface AdminBannerProps {
  role?: string;
}

export function AdminBanner({ role }: AdminBannerProps) {
  const t = useTranslations("admin");
  const locale = useLocale();

  if (role !== "admin") return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent)]/15 via-[var(--surface-2)] to-[var(--surface)] p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--accent)]">{t("badgeOwner")}</span>
              <span className="text-xs text-[var(--text-muted)]">•</span>
              <span className="text-xs font-medium text-[var(--text)]">{t("badgeAdmin")}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("adminNotice")}</p>
          </div>
        </div>

        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-[var(--accent)]/90 transition-colors shrink-0"
        >
          <span>{t("goToAdmin")}</span>
          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </Link>
      </div>
    </div>
  );
}
