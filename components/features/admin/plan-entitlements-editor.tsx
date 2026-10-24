"use client";

import { useState } from "react";
import { Plus, Trash2, Cpu } from "lucide-react";
import type { PlanEntitlements } from "@/lib/validation/plans";

interface PlanEntitlementsEditorProps {
  value: PlanEntitlements;
  onChange: (value: PlanEntitlements) => void;
  availableWorkflows?: { slug: string; name: string }[];
}

export function PlanEntitlementsEditor({
  value,
  onChange,
  availableWorkflows = [{ slug: "job-xray", name: "JobPost X-Ray" }],
}: PlanEntitlementsEditorProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState(
    availableWorkflows[0]?.slug ?? "job-xray"
  );
  const [meterKey, setMeterKey] = useState("runs");
  const [limit, setLimit] = useState<string>("50");

  const handleAddOrUpdate = () => {
    const parsedLimit = limit.trim() === "" ? null : parseInt(limit, 10);
    if (parsedLimit !== null && isNaN(parsedLimit)) return;

    const currentWf = value[selectedWorkflow] ?? {};
    const updated = {
      ...value,
      [selectedWorkflow]: {
        ...currentWf,
        [meterKey]: parsedLimit,
      },
    };
    onChange(updated);
  };

  const handleRemove = (wfSlug: string, mKey: string) => {
    const currentWf = { ...(value[wfSlug] ?? {}) };
    delete currentWf[mKey];

    const updated = { ...value };
    if (Object.keys(currentWf).length === 0) {
      delete updated[wfSlug];
    } else {
      updated[wfSlug] = currentWf;
    }
    onChange(updated);
  };

  const entries: { wfSlug: string; mKey: string; limitVal: number | null }[] = [];
  for (const [wfSlug, meters] of Object.entries(value)) {
    for (const [mKey, limitVal] of Object.entries(meters)) {
      entries.push({ wfSlug, mKey, limitVal });
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
        <Cpu className="h-4 w-4 text-[var(--accent)]" />
        <span>Entitlements & Meter Quotas</span>
      </div>

      {/* Existing Entitlements List */}
      <div className="space-y-1.5">
        {entries.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">
            No workflow quotas configured.
          </p>
        ) : (
          entries.map(({ wfSlug, mKey, limitVal }) => (
            <div
              key={`${wfSlug}-${mKey}`}
              className="flex items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs min-w-0"
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="font-mono font-bold text-[var(--accent)]">
                  {wfSlug}
                </span>
                <span className="text-[var(--text-muted)]">/</span>
                <span className="font-mono text-[var(--text)]">{mKey}:</span>
                <span className="font-semibold text-[var(--text)]">
                  {limitVal === null ? "Unlimited" : `${limitVal} units`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(wfSlug, mKey)}
                className="text-[var(--danger)] hover:text-red-400 p-1 rounded-sm shrink-0"
                title="Remove entitlement"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add New Entitlement Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
        <select
          value={selectedWorkflow}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)]"
        >
          {availableWorkflows.map((w) => (
            <option key={w.slug} value={w.slug}>
              {w.name} ({w.slug})
            </option>
          ))}
        </select>

        <select
          value={meterKey}
          onChange={(e) => setMeterKey(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--text)] font-mono"
        >
          <option value="runs">runs</option>
          <option value="ai_tokens">ai_tokens</option>
        </select>

        <input
          type="number"
          placeholder="Limit (blank=unlimited)"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="w-32 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)]"
          min={0}
        />

        <button
          type="button"
          onClick={handleAddOrUpdate}
          className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}
