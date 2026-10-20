"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

interface LanguageOption {
  code: "en" | "ar";
  label: string;
  flag: string;
  short: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    label: "English",
    flag: "/en.png",
    short: "EN",
  },
  {
    code: "ar",
    label: "العربية",
    flag: "/ar.png",
    short: "AR",
  },
];

export function LocaleSwitcher() {
  const currentLocale = useLocale() as "en" | "ar";
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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

  function switchLocale(nextLocale: "en" | "ar") {
    setIsOpen(false);
    if (nextLocale === currentLocale) return;

    // Replace current locale segment in URL with nextLocale
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const newPath = segments.join("/") || `/${nextLocale}`;
    router.push(newPath);
  }

  const activeLanguage: LanguageOption =
    LANGUAGES.find((lang) => lang.code === currentLocale) ?? {
      code: "en",
      label: "English",
      flag: "/en.png",
      short: "EN",
    };

  return (
    <div className="relative inline-block text-start" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
        className="group inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 px-2.5 py-1.5 text-xs font-semibold text-[var(--text)] transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] shadow-xs select-none"
      >
        <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-[var(--border)] shadow-xs">
          <Image
            src={activeLanguage.flag}
            alt={activeLanguage.label}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <span className="font-semibold text-xs tracking-wider text-[var(--text)]">
          {activeLanguage.short}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--accent)]" : "group-hover:text-[var(--text)]"
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Languages"
          className="absolute end-0 mt-2 min-w-[160px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="space-y-1">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLocale;

              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => switchLocale(lang.code)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors select-none text-start ${
                    isSelected
                      ? "bg-[var(--accent)]/15 text-[var(--accent)] font-bold"
                      : "text-[var(--text)] hover:bg-[var(--surface-2)] font-medium"
                  }`}
                >
                  <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-[var(--border)] shadow-xs">
                    <Image
                      src={lang.flag}
                      alt={lang.label}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="flex-1">{lang.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[var(--accent)] ms-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
