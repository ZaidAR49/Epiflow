"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Send,
  MessageCircle,
  Globe,
  Radio,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface WorkflowChannelItemRowProps {
  channel: WorkflowChannelItem;
  isPending: boolean;
  activeLabel: string;
  inactiveLabel: string;
  editLabel: string;
  deleteLabel: string;
  onEdit: (item: WorkflowChannelItem) => void;
  onDelete: (channelId: string) => void;
}

export function WorkflowChannelItemRow({
  channel,
  isPending,
  activeLabel,
  inactiveLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: WorkflowChannelItemRowProps) {
  const t = useTranslations("admin.channels");
  const tCommon = useTranslations("common");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getChannelIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "telegram":
        return <Send className="h-3.5 w-3.5 text-sky-400" />;
      case "whatsapp":
        return <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />;
      case "web":
        return <Globe className="h-3.5 w-3.5 text-indigo-400" />;
      default:
        return <Radio className="h-3.5 w-3.5 text-[var(--accent)]" />;
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 hover:border-[var(--accent)]/30 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
          {getChannelIcon(channel.channel)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text)] capitalize">
              {channel.channel}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[10px] font-medium border ${
                channel.isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              }`}
            >
              {channel.isActive ? (
                <CheckCircle2 className="h-2.5 w-2.5" />
              ) : (
                <XCircle className="h-2.5 w-2.5" />
              )}
              <span>{channel.isActive ? activeLabel : inactiveLabel}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-[var(--accent)]" dir="ltr">
              @{channel.handle}
            </span>
            {channel.url && (
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] underline"
                dir="ltr"
              >
                <span className="truncate max-w-[140px]">{channel.url}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ms-2">
        <button
          type="button"
          onClick={() => onEdit(channel)}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          title={editLabel}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title={deleteLabel}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            onDelete(channel.id);
            setConfirmDelete(false);
          }}
          title={t("confirmDeleteTitle")}
          description={t("confirmDeleteDesc")}
          confirmLabel={t("deleteChannel")}
          cancelLabel={tCommon("cancel")}
          variant="danger"
          isPending={isPending}
        />
      )}
    </div>
  );
}
