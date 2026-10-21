"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Pause,
  Play,
  Edit2,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from "lucide-react";
import type { AdminWorkflowItem } from "@/lib/db/queries/admin";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import { updateWorkflowAction } from "@/lib/actions/admin";
import { WorkflowEditDrawer } from "./workflow-edit-drawer";

interface WorkflowManagementCardProps {
  workflows: AdminWorkflowItem[];
  channels?: WorkflowChannelItem[];
}

export function WorkflowManagementCard({ workflows, channels = [] }: WorkflowManagementCardProps) {
  const t = useTranslations("admin.workflows");
  const locale = useLocale();
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Partial<AdminWorkflowItem>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string; msg: string; err?: boolean } | null>(null);

  const items = workflows.map((w) => ({
    ...w,
    ...(overrides[w.id] || {}),
  }));

  const handleStartEdit = (w: AdminWorkflowItem) => {
    setEditingId(w.id);
    setEditName(w.name);
    setEditImageUrl(w.imageUrl || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditImageUrl("");
  };

  const handleToggleActive = (w: AdminWorkflowItem) => {
    startTransition(async () => {
      const nextActive = !w.isActive;
      const res = await updateWorkflowAction({
        workflowId: w.id,
        isActive: nextActive,
      });
      if (res.success) {
        setOverrides((prev) => ({
          ...prev,
          [w.id]: { ...prev[w.id], isActive: nextActive },
        }));
        setFeedback({ id: w.id, msg: t("updateSuccess") });
        router.refresh();
      } else {
        setFeedback({ id: w.id, msg: res.error || "Failed", err: true });
      }
    });
  };

  const handleSaveDetails = (workflowId: string) => {
    startTransition(async () => {
      const res = await updateWorkflowAction({
        workflowId,
        name: editName.trim() || undefined,
        imageUrl: editImageUrl.trim() || null,
      });
      if (res.success) {
        setOverrides((prev) => ({
          ...prev,
          [workflowId]: {
            ...prev[workflowId],
            name: editName.trim() || prev[workflowId]?.name,
            imageUrl: editImageUrl.trim() || null,
          },
        }));
        setEditingId(null);
        setFeedback({ id: workflowId, msg: t("updateSuccess") });
        router.refresh();
      } else {
        setFeedback({ id: workflowId, msg: res.error || "Failed", err: true });
      }
    });
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">{t("title")}</h2>
            <p className="text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((w) => {
          const isEditing = editingId === w.id;
          const cardImageUrl = isEditing && editImageUrl ? editImageUrl : w.imageUrl;

          return (
            <div
              key={w.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 transition-all"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Avatar + Title & Meta */}
                <div className="flex items-center gap-4">
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

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text)]">{w.name}</h3>
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
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(w)}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
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
                    onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit(w))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
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
                    href={`/${locale}/workflows/${w.slug}/console`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent)]/90 transition-colors"
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
                    setOverrides((prev) => ({
                      ...prev,
                      [w.id]: { ...prev[w.id], imageUrl: url },
                    }));
                    router.refresh();
                  }}
                  onCancel={handleCancelEdit}
                  onSave={() => handleSaveDetails(w.id)}
                />
              )}

              {feedback && feedback.id === w.id && (
                <p
                  className={`mt-2 text-xs ${
                    feedback.err ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {feedback.msg}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
