"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Users, User, Link as LinkIcon, Loader2, AlertCircle, Fingerprint } from "lucide-react";
import { sendNotificationAction } from "@/lib/actions/notifications";
import { useToast } from "@/hooks/use-toast";
import type { AdminCallerRole } from "./admin-shell";

interface SendNotificationFormProps {
  callerRole: AdminCallerRole;
  onDispatched?: () => void;
  onCancel?: () => void;
}

export function SendNotificationForm({
  callerRole,
  onDispatched,
  onCancel,
}: SendNotificationFormProps) {
  const t = useTranslations("admin.notifications");
  const toast = useToast();

  const [recipientMode, setRecipientMode] = useState<"broadcast" | "single">("broadcast");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [type, setType] = useState<string>("update");
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMutate = callerRole === "admin" || callerRole === "editor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate) {
      toast.error(t("viewerRestricted"));
      return;
    }

    const trimmedUserId = targetUserId.trim();
    if (recipientMode === "single" && !trimmedUserId) {
      setError(t("userIdRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await sendNotificationAction({
      recipientMode,
      userId: recipientMode === "single" ? trimmedUserId : undefined,
      type: type.trim().toLowerCase(),
      title: title.trim(),
      body: body.trim() || null,
      link: link.trim() || null,
    });

    setIsSubmitting(false);

    if (res.success) {
      toast.success(t("sendSuccess", { count: res.count ?? 1 }));
      setTitle("");
      setBody("");
      setLink("");
      if (recipientMode === "single") {
        setTargetUserId("");
      }
      onDispatched?.();
    } else {
      setError(res.error || "Failed to dispatch notification");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recipient selection */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
          {t("recipientLabel")}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRecipientMode("broadcast")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              recipientMode === "broadcast"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t("allUsers")}</span>
          </button>

          <button
            type="button"
            onClick={() => setRecipientMode("single")}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              recipientMode === "single"
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>{t("singleUser")}</span>
          </button>
        </div>
      </div>

      {/* Direct User ID input for scalability */}
      {recipientMode === "single" && (
        <div>
          <label htmlFor="send-notif-target-user-id" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("targetUserId")}
          </label>
          <div className="relative">
            <Fingerprint className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              id="send-notif-target-user-id"
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              required
              placeholder={t("targetUserIdPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-8 pe-3 py-2 text-xs font-mono text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {t("targetUserIdHelp")}
          </p>
        </div>
      )}

      {/* Event type & Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="send-notif-type" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("notificationTypeLabel")}
          </label>
          <select
            id="send-notif-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
          >
            <option value="update">{t("optUpdate")}</option>
            <option value="system">{t("optSystem")}</option>
            <option value="access_approved">{t("optAccessApproved")}</option>
            <option value="quota_low">{t("optQuotaLow")}</option>
            <option value="maintenance">{t("optMaintenance")}</option>
            <option value="general">{t("optGeneral")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="send-notif-link" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
            {t("notificationLinkLabel")}
          </label>
          <div className="relative">
            <LinkIcon className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              id="send-notif-link"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t("notificationLinkPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] ps-8 pe-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div>
        <label htmlFor="send-notif-title" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
          {t("notificationTitleLabel")}
        </label>
        <input
          id="send-notif-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden"
        />
      </div>

      {/* Message body */}
      <div>
        <label htmlFor="send-notif-body" className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
          {t("notificationBodyLabel")}
        </label>
        <textarea
          id="send-notif-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder={t("bodyPlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-hidden resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !canMutate}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
          )}
          <span>{isSubmitting ? t("sending") : t("sendButton")}</span>
        </button>
      </div>
    </form>
  );
}
