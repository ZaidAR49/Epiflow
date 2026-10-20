"use client";

import { useTranslations } from "next-intl";
import { Save, X } from "lucide-react";
import type { AdminWorkflowItem } from "@/lib/db/queries/admin";
import { WorkflowImageUploader } from "./workflow-image-uploader";

interface WorkflowEditDrawerProps {
  workflow: AdminWorkflowItem;
  editName: string;
  editImageUrl: string;
  isPending: boolean;
  onNameChange: (val: string) => void;
  onImageUrlChange: (val: string) => void;
  onImageUploaded: (url: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function WorkflowEditDrawer({
  workflow,
  editName,
  editImageUrl,
  isPending,
  onNameChange,
  onImageUrlChange,
  onImageUploaded,
  onCancel,
  onSave,
}: WorkflowEditDrawerProps) {
  const t = useTranslations("admin.workflows");

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("nameLabel")}
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            {t("imageUrlLabel")}
          </label>
          <input
            type="url"
            value={editImageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder={t("imageUrlPlaceholder")}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      <WorkflowImageUploader
        workflowId={workflow.id}
        currentImageUrl={editImageUrl || workflow.imageUrl}
        onUploaded={onImageUploaded}
      />

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <X className="h-3.5 w-3.5" />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent)]/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isPending ? t("saving") : t("saveChanges")}</span>
        </button>
      </div>
    </div>
  );
}
