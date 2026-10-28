"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import type {
  AnnouncementType,
  AnnouncementSeverity,
} from "@/lib/db/schema/system-announcements";

interface AnnouncementFormFieldsProps {
  type: AnnouncementType;
  setType: (val: AnnouncementType) => void;
  severity: AnnouncementSeverity;
  setSeverity: (val: AnnouncementSeverity) => void;
  titleAr: string;
  setTitleAr: (val: string) => void;
  titleEn: string;
  setTitleEn: (val: string) => void;
  bodyAr: string;
  setBodyAr: (val: string) => void;
  bodyEn: string;
  setBodyEn: (val: string) => void;
  startsAt: string;
  setStartsAt: (val: string) => void;
  endsAt: string;
  setEndsAt: (val: string) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
}

export function AnnouncementFormFields({
  type,
  setType,
  severity,
  setSeverity,
  titleAr,
  setTitleAr,
  titleEn,
  setTitleEn,
  bodyAr,
  setBodyAr,
  bodyEn,
  setBodyEn,
  startsAt,
  setStartsAt,
  endsAt,
  setEndsAt,
  isActive,
  setIsActive,
}: AnnouncementFormFieldsProps) {
  const t = useTranslations("admin.notifications");
  const tAnnounce = useTranslations("announcements");

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="announcement-type" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("typeLabel")}
          </label>
          <select
            id="announcement-type"
            value={type}
            onChange={(e) => setType(e.target.value as AnnouncementType)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
          >
            <option value="update">{tAnnounce("types.update")}</option>
            <option value="maintenance">{tAnnounce("types.maintenance")}</option>
            <option value="message">{tAnnounce("types.message")}</option>
            <option value="changelog">{tAnnounce("types.changelog")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="announcement-severity" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("severityLabel")}
          </label>
          <select
            id="announcement-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AnnouncementSeverity)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
          >
            <option value="info">{tAnnounce("severities.info")}</option>
            <option value="warning">{tAnnounce("severities.warning")}</option>
            <option value="critical">{tAnnounce("severities.critical")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="announcement-title-ar" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("titleArLabel")}
          </label>
          <input
            id="announcement-title-ar"
            type="text"
            dir="rtl"
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
            placeholder={t("titleArPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="announcement-title-en" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("titleEnLabel")}
          </label>
          <input
            id="announcement-title-en"
            type="text"
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder={t("titleEnPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="announcement-body-ar" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("bodyArLabel")}
          </label>
          <textarea
            id="announcement-body-ar"
            rows={2}
            dir="rtl"
            value={bodyAr}
            onChange={(e) => setBodyAr(e.target.value)}
            placeholder={t("bodyArPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden resize-none"
          />
        </div>

        <div>
          <label htmlFor="announcement-body-en" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("bodyEnLabel")}
          </label>
          <textarea
            id="announcement-body-en"
            rows={2}
            dir="ltr"
            value={bodyEn}
            onChange={(e) => setBodyEn(e.target.value)}
            placeholder={t("bodyEnPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="announcement-starts-at" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("startsAtLabel")}
          </label>
          <div className="relative">
            <input
              id="announcement-starts-at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-9 pe-3 py-2 text-xs text-[var(--text)] font-medium focus:border-[var(--accent)] focus:outline-hidden [color-scheme:dark] cursor-pointer"
            />
            <Calendar className="absolute start-2.5 top-2.5 h-4 w-4 text-[var(--accent)] pointer-events-none" />
          </div>
        </div>

        <div>
          <label htmlFor="announcement-ends-at" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("endsAtLabel")}
          </label>
          <div className="relative">
            <input
              id="announcement-ends-at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-9 pe-3 py-2 text-xs text-[var(--text)] font-medium focus:border-[var(--accent)] focus:outline-hidden [color-scheme:dark] cursor-pointer"
            />
            <Calendar className="absolute start-2.5 top-2.5 h-4 w-4 text-[var(--accent)] pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="announcement-is-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded-sm border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)] focus:ring-[var(--accent)]"
        />
        <label
          htmlFor="announcement-is-active"
          className="text-xs font-semibold text-[var(--text)] cursor-pointer"
        >
          {t("activeStatus")}
        </label>
      </div>
    </>
  );
}
