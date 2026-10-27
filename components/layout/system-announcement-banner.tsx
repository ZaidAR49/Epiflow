"use client";

import React, { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Wrench,
  MessageSquare,
  FileText,
  X,
} from "lucide-react";
import type { SystemAnnouncement } from "@/lib/db/schema/system-announcements";
import {
  getActiveAnnouncementsAction,
  markAnnouncementReadAction,
} from "@/lib/actions/announcements";

const STORAGE_KEY = "epiflow_dismissed_announcements";

function TypeIconComponent({ type, className }: { type: string; className: string }) {
  switch (type) {
    case "update":
      return <Sparkles className={className} />;
    case "maintenance":
      return <Wrench className={className} />;
    case "changelog":
      return <FileText className={className} />;
    case "message":
    default:
      return <MessageSquare className={className} />;
  }
}

function SeverityIconComponent({ severity, className }: { severity: string; className: string }) {
  switch (severity) {
    case "critical":
      return <AlertOctagon className={className} />;
    case "warning":
      return <AlertTriangle className={className} />;
    case "info":
    default:
      return <Info className={className} />;
  }
}

function getSeverityStyles(severity: string): {
  container: string;
  badge: string;
  icon: string;
} {
  switch (severity) {
    case "critical":
      return {
        container: "bg-rose-950/60 border-rose-500/30 text-rose-100",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        icon: "text-rose-400",
      };
    case "warning":
      return {
        container: "bg-amber-950/60 border-amber-500/30 text-amber-100",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: "text-amber-400",
      };
    case "info":
    default:
      return {
        container: "bg-indigo-950/60 border-indigo-500/30 text-indigo-100",
        badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        icon: "text-indigo-400",
      };
  }
}

let cachedAnnouncements: SystemAnnouncement[] | null = null;
let lastAnnouncementsFetchTime = 0;
const ANNOUNCEMENTS_TTL_MS = 60_000;

interface SystemAnnouncementBannerProps {
  isSignedIn?: boolean;
}

export function SystemAnnouncementBanner({
  isSignedIn = false,
}: SystemAnnouncementBannerProps) {
  const t = useTranslations("announcements");
  const locale = useLocale();

  const getInitialAnnouncements = (): SystemAnnouncement[] => {
    if (!isSignedIn || !cachedAnnouncements) return [];
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const dismissed: string[] = stored ? JSON.parse(stored) : [];
      return cachedAnnouncements.filter((a) => !dismissed.includes(a.id));
    } catch {
      return cachedAnnouncements;
    }
  };

  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(getInitialAnnouncements);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => !isSignedIn || cachedAnnouncements !== null);

  useEffect(() => {
    if (!isSignedIn) return;

    const isFresh =
      cachedAnnouncements !== null &&
      Date.now() - lastAnnouncementsFetchTime < ANNOUNCEMENTS_TTL_MS;

    if (isFresh) {
      return;
    }

    let isMounted = true;
    getActiveAnnouncementsAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.announcements) {
          cachedAnnouncements = res.announcements;
          lastAnnouncementsFetchTime = Date.now();

          let dismissed: string[] = [];
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              dismissed = JSON.parse(stored);
            }
          } catch {
            // localStorage not available
          }
          const visible = res.announcements.filter(
            (a) => !dismissed.includes(a.id)
          );
          setAnnouncements(visible);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  const handleDismiss = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    try {
       const stored = localStorage.getItem(STORAGE_KEY);
       const dismissed: string[] = stored ? JSON.parse(stored) : [];
       if (!dismissed.includes(id)) {
         dismissed.push(id);
         localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
       }
    } catch {
       // ignore
    }
    // Record dismissal for the authenticated user in database
    void markAnnouncementReadAction(id);
  };

  if (!isSignedIn || !isLoaded || announcements.length === 0) {
    return null;
  }

  const announcement = announcements[0];
  if (!announcement) return null;

  const title =
    locale === "ar"
      ? announcement.titleAr || announcement.titleEn
      : announcement.titleEn || announcement.titleAr;

  const body =
    locale === "ar"
      ? announcement.bodyAr || announcement.bodyEn
      : announcement.bodyEn || announcement.bodyAr;

  const styles = getSeverityStyles(announcement.severity);
  const typeLabel = t(`types.${announcement.type}` as const) || announcement.type;
  const severityLabel =
    t(`severities.${announcement.severity}` as const) || announcement.severity;

  return (
    <div
      role="region"
      aria-label={t("bannerAria")}
      className={`w-full border-b backdrop-blur-md px-4 py-2.5 transition-all ${styles.container}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          <SeverityIconComponent
            severity={announcement.severity}
            className={`h-4 w-4 shrink-0 ${styles.icon}`}
          />

          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border shrink-0 ${styles.badge}`}
          >
            <TypeIconComponent type={announcement.type} className="h-3 w-3" />
            <span>{typeLabel}</span>
            {announcement.severity === "critical" && (
              <span className="ms-1 uppercase font-black text-rose-400">
                • {severityLabel}
              </span>
            )}
          </span>

          <span className="font-bold tracking-tight text-white truncate max-w-sm sm:max-w-md md:max-w-lg">
            {title}
          </span>

          {body && (
            <span className="hidden lg:inline text-[11px] opacity-85 truncate max-w-md">
              — {body}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleDismiss(announcement.id)}
          className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-1 focus:ring-white"
          title={t("dismiss")}
          aria-label={t("dismiss")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
