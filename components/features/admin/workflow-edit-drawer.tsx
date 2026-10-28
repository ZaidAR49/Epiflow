"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, X } from "lucide-react";
import type { AdminWorkflowItem } from "@/lib/db/queries/admin";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import { saveWorkflowChannelAction } from "@/lib/actions/workflow-channels";
import { WorkflowImageUploader } from "./workflow-image-uploader";
import { WorkflowChannelsEditor, type ChannelDraft } from "./workflow-channels-editor";

interface WorkflowEditDrawerProps {
  workflow: AdminWorkflowItem;
  editName: string;
  editImageUrl: string;
  channels?: WorkflowChannelItem[];
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
  channels = [],
  isPending,
  onNameChange,
  onImageUrlChange,
  onImageUploaded,
  onCancel,
  onSave,
}: WorkflowEditDrawerProps) {
  const t = useTranslations("admin.workflows");
  const [channelDraft, setChannelDraft] = useState<ChannelDraft | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleSaveAll = async () => {
    if (channelDraft && channelDraft.handle.trim().length > 0) {
      setIsSavingDraft(true);
      try {
        await saveWorkflowChannelAction({
          workflowId: workflow.id,
          channel: channelDraft.channel,
          handle: channelDraft.handle.trim(),
          url: channelDraft.url.trim() || null,
          isActive: channelDraft.isActive,
        });
      } finally {
        setIsSavingDraft(false);
      }
    }
    onSave();
  };

  const busy = isPending || isSavingDraft;

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCancel();
        }
      }}
      className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 space-y-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="wf-edit-name" className="block text-xs font-medium text-[var(--text-muted)]">
            {t("nameLabel")}
          </label>
          <input
            id="wf-edit-name"
            type="text"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label htmlFor="wf-edit-image" className="block text-xs font-medium text-[var(--text-muted)]">
            {t("imageUrlLabel")}
          </label>
          <input
            id="wf-edit-image"
            type="url"
            value={editImageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            placeholder={t("imageUrlPlaceholder")}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden"
          />
        </div>
      </div>

      <WorkflowImageUploader
        workflowId={workflow.id}
        currentImageUrl={editImageUrl || workflow.imageUrl}
        onUploaded={onImageUploaded}
      />

      <WorkflowChannelsEditor
        workflowId={workflow.id}
        initialChannels={channels}
        onDraftChange={setChannelDraft}
      />

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          <span>{t("cancel")}</span>
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent)]/90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-hidden disabled:opacity-50 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{busy ? t("saving") : t("saveChanges")}</span>
        </button>
      </div>
    </div>
  );
}
