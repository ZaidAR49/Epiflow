"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import type { AdminWorkflowItem } from "@/lib/db/queries/admin";
import type { WorkflowChannelItem } from "@/lib/db/queries/workflow-channels";
import { WorkflowCardItem } from "./workflow-card-item";

interface WorkflowManagementCardProps {
  workflows: AdminWorkflowItem[];
  channels?: WorkflowChannelItem[];
}

export function WorkflowManagementCard({
  workflows,
  channels = [],
}: WorkflowManagementCardProps) {
  const t = useTranslations("admin.workflows");
  const [overrides, setOverrides] = useState<Record<string, Partial<AdminWorkflowItem>>>({});

  const items = workflows.map((w) => ({
    ...w,
    ...(overrides[w.id] || {}),
  }));

  const handleWorkflowUpdated = (workflowId: string, updates: Partial<AdminWorkflowItem>) => {
    setOverrides((prev) => ({
      ...prev,
      [workflowId]: {
        ...prev[workflowId],
        ...updates,
      },
    }));
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
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
        {items.map((w) => (
          <WorkflowCardItem
            key={w.id}
            workflow={w}
            channels={channels}
            onWorkflowUpdated={handleWorkflowUpdated}
          />
        ))}
      </div>
    </div>
  );
}
