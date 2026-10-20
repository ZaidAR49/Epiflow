"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(nextLocale: string) {
    if (nextLocale === currentLocale) return;
    // Replace current locale segment in URL with nextLocale
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const newPath = segments.join("/") || `/${nextLocale}`;
    router.push(newPath);
  }

  const nextLocale = currentLocale === "ar" ? "en" : "ar";
  const label = currentLocale === "ar" ? "English" : "العربية";

  return (
    <button
      type="button"
      onClick={() => switchLocale(nextLocale)}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
      aria-label="Switch Language"
    >
      <Globe className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
