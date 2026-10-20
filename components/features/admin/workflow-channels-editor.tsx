"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, AlertCircle, CheckCircle2, Radio } from "lucide-react";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import {
  saveWorkflowChannelAction,
  deleteWorkflowChannelAction,
} from "@/lib/actions/workflow-channels";
import { WorkflowChannelItemRow } from "./workflow-channel-item-row";
import { WorkflowChannelForm } from "./workflow-channel-form";

export interface ChannelDraft {
  channel: string;
  handle: string;
  url: string;
  isActive: boolean;
}

interface WorkflowChannelsEditorProps {
  workflowId: string;
  initialChannels: WorkflowChannelItem[];
  onChannelsChanged?: () => void;
  onDraftChange?: (draft: ChannelDraft | null) => void;
}

export function WorkflowChannelsEditor({
  workflowId,
  initialChannels,
  onChannelsChanged,
  onDraftChange,
}: WorkflowChannelsEditorProps) {
  const t = useTranslations("admin.channels");
  const router = useRouter();
  const [channels, setChannels] = useState<WorkflowChannelItem[]>(initialChannels);
  const [editingChannel, setEditingChannel] = useState<WorkflowChannelItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(initialChannels.length === 0);

  // Form states
  const [channelType, setChannelType] = useState("telegram");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ msg: string; err?: boolean } | null>(null);

  // Sync draft state to parent
  useEffect(() => {
    if (isAddingNew && handle.trim().length > 0) {
      onDraftChange?.({
        channel: channelType,
        handle: handle.trim(),
        url: url.trim(),
        isActive,
      });
    } else {
      onDraftChange?.(null);
    }
  }, [isAddingNew, handle, channelType, url, isActive, onDraftChange]);

  const resetForm = () => {
    setEditingChannel(null);
    setIsAddingNew(false);
    setChannelType("telegram");
    setHandle("");
    setUrl("");
    setIsActive(true);
    setFeedback(null);
    onDraftChange?.(null);
  };

  const handleStartEdit = (item: WorkflowChannelItem) => {
    setEditingChannel(item);
    setIsAddingNew(true);
    setChannelType(item.channel);
    setHandle(item.handle);
    setUrl(item.url || "");
    setIsActive(item.isActive);
    setFeedback(null);
  };

  const handleSave = () => {
    if (!handle.trim()) {
      setFeedback({ msg: t("handleLabel") + " is required", err: true });
      return;
    }

    startTransition(async () => {
      const res = await saveWorkflowChannelAction({
        workflowId,
        channel: channelType,
        handle: handle.trim(),
        url: url.trim() || null,
        isActive,
      });

      if (res.success && res.channel) {
        const saved = res.channel;
        setChannels((prev) => {
          const idx = prev.findIndex((c) => c.channel === saved.channel);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setFeedback({ msg: t("savedSuccess") });
        resetForm();
        onChannelsChanged?.();
        router.refresh();
      } else {
        setFeedback({ msg: res.error || "Save failed", err: true });
      }
    });
  };

  const handleDelete = (channelId: string) => {
    startTransition(async () => {
      const res = await deleteWorkflowChannelAction({
        channelId,
        workflowId,
      });

      if (res.success) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        setFeedback({ msg: t("deletedSuccess") });
        onChannelsChanged?.();
        router.refresh();
      } else {
        setFeedback({ msg: res.error || "Delete failed", err: true });
      }
    });
  };


  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h4 className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
            <Radio className="h-4 w-4 text-[var(--accent)]" />
            <span>{t("title")}</span>
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t("subtitle")}</p>
        </div>
        {!isAddingNew && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddingNew(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t("addChannel")}</span>
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
            feedback.err
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {feedback.err ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Inline Form */}
      {isAddingNew && (
        <WorkflowChannelForm
          isEditing={Boolean(editingChannel)}
          channelType={channelType}
          handle={handle}
          url={url}
          isActive={isActive}
          isPending={isPending}
          onChannelTypeChange={setChannelType}
          onHandleChange={setHandle}
          onUrlChange={setUrl}
          onIsActiveChange={setIsActive}
          onCancel={resetForm}
          onSave={handleSave}
        />
      )}

      {/* Channels List */}
      <div className="space-y-2">
        {channels.length === 0 ? (
          <p className="text-center py-4 text-xs text-[var(--text-muted)] italic">
            {t("noChannels")}
          </p>
        ) : (
          channels.map((ch) => (
            <WorkflowChannelItemRow
              key={ch.id}
              channel={ch}
              isPending={isPending}
              activeLabel={t("active")}
              inactiveLabel={t("inactive")}
              editLabel={t("editChannel")}
              deleteLabel={t("deleteChannel")}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
