"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Save } from "lucide-react";

interface WorkflowChannelFormProps {
  isEditing: boolean;
  channelType: string;
  handle: string;
  url: string;
  isActive: boolean;
  isPending: boolean;
  onChannelTypeChange: (val: string) => void;
  onHandleChange: (val: string) => void;
  onUrlChange: (val: string) => void;
  onIsActiveChange: (val: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}

const PRESET_CHANNELS = [
  { value: "telegram", label: "Telegram Bot" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "web", label: "Web Portal" },
];

export function WorkflowChannelForm({
  isEditing,
  channelType,
  handle,
  url,
  isActive,
  isPending,
  onChannelTypeChange,
  onHandleChange,
  onUrlChange,
  onIsActiveChange,
  onCancel,
  onSave,
}: WorkflowChannelFormProps) {
  const t = useTranslations("admin.channels");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--text)]">
          {isEditing ? t("editChannel") : t("addChannel")}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
            {t("channelLabel")}
          </label>
          <select
            value={channelType}
            onChange={(e) => onChannelTypeChange(e.target.value)}
            disabled={isEditing}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          >
            {PRESET_CHANNELS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
            {t("handleLabel")}
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => onHandleChange(e.target.value)}
            placeholder={t("handlePlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
            {t("urlLabel")}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={t("urlPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none font-mono"
          />
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-muted)]">{t("handleHelp")}</p>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[var(--text)]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => onIsActiveChange(e.target.checked)}
            className="rounded border-[var(--border)] bg-[var(--surface-2)] text-[var(--accent)] focus:ring-0"
          />
          <span>{isActive ? t("active") : t("inactive")}</span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent)]/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isPending ? t("saving") : t("saveChannel")}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
