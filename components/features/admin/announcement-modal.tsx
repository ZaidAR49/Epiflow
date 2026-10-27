"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/lib/actions/announcements";
import { useToast } from "@/hooks/use-toast";
import type {
  SystemAnnouncement,
  AnnouncementType,
  AnnouncementSeverity,
} from "@/lib/db/schema/system-announcements";
import { AnnouncementFormFields } from "./announcement-form-fields";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (announcement: SystemAnnouncement) => void;
  initialData?: SystemAnnouncement | null;
}

export function AnnouncementModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AnnouncementModalProps) {
  if (!isOpen) return null;

  return (
    <AnnouncementModalContent
      key={initialData?.id ?? "new"}
      onClose={onClose}
      onSuccess={onSuccess}
      initialData={initialData}
    />
  );
}

function AnnouncementModalContent({
  onClose,
  onSuccess,
  initialData,
}: {
  onClose: () => void;
  onSuccess: (announcement: SystemAnnouncement) => void;
  initialData?: SystemAnnouncement | null;
}) {
  const t = useTranslations("admin.notifications");
  const toast = useToast();
  const isEditing = Boolean(initialData);

  const [type, setType] = useState<AnnouncementType>(
    (initialData?.type as AnnouncementType) || "update"
  );
  const [severity, setSeverity] = useState<AnnouncementSeverity>(
    (initialData?.severity as AnnouncementSeverity) || "info"
  );
  const [titleAr, setTitleAr] = useState(initialData?.titleAr || "");
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || "");
  const [bodyAr, setBodyAr] = useState(initialData?.bodyAr || "");
  const [bodyEn, setBodyEn] = useState(initialData?.bodyEn || "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [startsAt, setStartsAt] = useState(
    initialData?.startsAt
      ? new Date(initialData.startsAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endsAt, setEndsAt] = useState(
    initialData?.endsAt
      ? new Date(initialData.endsAt).toISOString().slice(0, 16)
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      type,
      severity,
      titleAr: titleAr.trim() || null,
      titleEn: titleEn.trim() || null,
      bodyAr: bodyAr.trim() || null,
      bodyEn: bodyEn.trim() || null,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    };

    if (isEditing && initialData) {
      const res = await updateAnnouncementAction({
        id: initialData.id,
        ...payload,
      });

      if (res.success && res.announcement) {
        toast.success(t("announcementSaved"));
        onSuccess(res.announcement);
        onClose();
      } else {
        setError(res.error || "Failed to update announcement");
        setIsSubmitting(false);
      }
    } else {
      const res = await createAnnouncementAction(payload);
      if (res.success && res.announcement) {
        toast.success(t("announcementSaved"));
        onSuccess(res.announcement);
        onClose();
      } else {
        setError(res.error || "Failed to create announcement");
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text)]">
                {isEditing ? t("editAnnouncement") : t("newAnnouncement")}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnnouncementFormFields
            type={type}
            setType={setType}
            severity={severity}
            setSeverity={setSeverity}
            titleAr={titleAr}
            setTitleAr={setTitleAr}
            titleEn={titleEn}
            setTitleEn={setTitleEn}
            bodyAr={bodyAr}
            setBodyAr={setBodyAr}
            bodyEn={bodyEn}
            setBodyEn={setBodyEn}
            startsAt={startsAt}
            setStartsAt={setStartsAt}
            endsAt={endsAt}
            setEndsAt={setEndsAt}
            isActive={isActive}
            setIsActive={setIsActive}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEditing ? t("saveChanges") : t("createAnnouncement")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
