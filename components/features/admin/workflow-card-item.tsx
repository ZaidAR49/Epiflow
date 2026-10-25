"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Pause,
  Play,
  Edit2,
  ExternalLink,
  ArrowRight,
  Sliders,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from "lucide-react";
import type { AdminWorkflowItem } from "@/lib/db/queries/admin";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import { updateWorkflowAction } from "@/lib/actions/admin";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { WorkflowEditDrawer } from "./workflow-edit-drawer";

interface WorkflowCardItemProps {
  workflow: AdminWorkflowItem;
  channels: WorkflowChannelItem[];
  onWorkflowUpdated: (workflowId: string, updates: Partial<AdminWorkflowItem>) => void;
}

export function WorkflowCardItem({
  workflow: w,
  channels,
  onWorkflowUpdated,
}: WorkflowCardItemProps) {
  const t = useTranslations("admin.workflows");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmToggle, setShowConfirmToggle] = useState(false);
  const [editName, setEditName] = useState(w.name);
  const [editImageUrl, setEditImageUrl] = useState(w.imageUrl || "");
  const [isPending, startTransition] = useTransition();

  const handleStartEdit = () => {
    setEditName(w.name);
    setEditImageUrl(w.imageUrl || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(w.name);
    setEditImageUrl(w.imageUrl || "");
  };

  const handleConfirmToggleActive = () => {
    startTransition(async () => {
      const nextActive = !w.isActive;
      const res = await updateWorkflowAction({
        workflowId: w.id,
        isActive: nextActive,
      });

      setShowConfirmToggle(false);
      if (res.success) {
        onWorkflowUpdated(w.id, { isActive: nextActive });
        toast.success(nextActive ? t("resumedSuccess") : t("pausedSuccess"));
        router.refresh();
      } else {
        toast.error(tCommon("error"), res.error || "Action failed");
      }
    });
  };

  const handleSaveDetails = () => {
    startTransition(async () => {
      const res = await updateWorkflowAction({
        workflowId: w.id,
        name: editName.trim() || undefined,
        imageUrl: editImageUrl.trim() || null,
      });

      if (res.success) {
        onWorkflowUpdated(w.id, {
          name: editName.trim() || w.name,
          imageUrl: editImageUrl.trim() || null,
        });
        setIsEditing(false);
        toast.success(t("updateSuccess"));
        router.refresh();
      } else {
        toast.error(tCommon("error"), res.error || "Update failed");
      }
    });
  };

  const cardImageUrl = isEditing && editImageUrl ? editImageUrl : w.imageUrl;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Avatar + Title & Meta */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {cardImageUrl ? (
              <Image
                src={cardImageUrl}
                alt={w.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-[var(--text-muted)]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[var(--text)] truncate">{w.name}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                  w.isActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {w.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    {t("statusActive")}
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    {t("statusSuspended")}
                  </>
                )}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
              <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--text)]">
                {w.slug}
              </code>
              <span>•</span>
              <span>
                {w.usersCount} {t("registeredUsers")}
              </span>
              <span>•</span>
              <span>
                {w.totalRuns} {t("totalRuns")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfirmToggle(true)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
              w.isActive
                ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            }`}
          >
            {w.isActive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>{t("pauseWorkflow")}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{t("resumeWorkflow")}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>{t("editDetails")}</span>
          </button>

          <Link
            href={`/${locale}/workflows/${w.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/50 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t("viewLandingPage")}</span>
          </Link>

          <Link
            href={`/${locale}/test-workflow/${w.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-colors"
            title="Open interactive test bench for this workflow"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{t("testBench")}</span>
          </Link>

          <Link
            href={`/${locale}/workflows/${w.slug}/console`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent)]/90 transition-colors"
          >
            <span>{t("openConsole")}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>

      {/* Edit Drawer */}
      {isEditing && (
        <WorkflowEditDrawer
          workflow={w}
          editName={editName}
          editImageUrl={editImageUrl}
          channels={channels.filter((c) => c.workflowId === w.id)}
          isPending={isPending}
          onNameChange={setEditName}
          onImageUrlChange={setEditImageUrl}
          onImageUploaded={(url) => {
            setEditImageUrl(url);
            onWorkflowUpdated(w.id, { imageUrl: url });
            router.refresh();
          }}
          onCancel={handleCancelEdit}
          onSave={handleSaveDetails}
        />
      )}

      {/* Confirmation Dialog for Toggle Active */}
      <ConfirmDialog
        isOpen={showConfirmToggle}
        onClose={() => setShowConfirmToggle(false)}
        onConfirm={handleConfirmToggleActive}
        title={w.isActive ? t("confirmPauseTitle") : t("confirmResumeTitle")}
        description={w.isActive ? t("confirmPauseDesc") : t("confirmResumeDesc")}
        confirmLabel={w.isActive ? t("pauseWorkflow") : t("resumeWorkflow")}
        cancelLabel={tCommon("cancel")}
        variant={w.isActive ? "warning" : "primary"}
        isPending={isPending}
      />
    </div>
  );
}
