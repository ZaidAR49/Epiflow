"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Play, RotateCcw, Activity, CheckCircle2, Terminal, Sparkles } from "lucide-react";

export const TEST_BENCH_PRESETS = [
  {
    name: "1. Post WITH Email",
    url: "https://www.linkedin.com/posts/recruiter-sarah_hiring-senior-engineer-send-cv-to-careers-techcorp-com-activity-7198273645/",
  },
  {
    name: "2. Post WITHOUT Email (Your Link)",
    url: "https://lnkd.in/p/dJB6fHjE",
  },
  {
    name: "3. Company Direct Post",
    url: "https://www.linkedin.com/posts/techcorp-official_we-are-expanding-join-our-engineering-team-activity-7182930495/",
  },
];

interface TestBenchControlsProps {
  url: string;
  onUrlChange: (url: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onReset: () => void;
  totalNodes: number;
  completedNodes: number;
  totalLogs: number;
  durationMs: number | null;
  viewMode: "split" | "canvas" | "chat";
  onViewModeChange: (mode: "split" | "canvas" | "chat") => void;
}

export function TestBenchControls({
  url,
  onUrlChange,
  isRunning,
  onRun,
  onReset,
  totalNodes,
  completedNodes,
  totalLogs,
  durationMs,
  viewMode,
  onViewModeChange,
}: TestBenchControlsProps) {
  const t = useTranslations("testBench");

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--accent)] border border-[var(--accent)]/20">
              Visual n8n Debugger
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)]">
              JobPost X-Ray Workflow Test Bench
            </h1>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Inspect all 24 nodes from job-xray.json live with input/output JSON viewers, execution timing, and logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 p-0.5 text-xs">
            <button
              onClick={() => onViewModeChange("split")}
              type="button"
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === "split"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => onViewModeChange("canvas")}
              type="button"
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === "canvas"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Canvas Flow
            </button>
            <button
              onClick={() => onViewModeChange("chat")}
              type="button"
              className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                viewMode === "chat"
                  ? "bg-[var(--accent)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Live Chat
            </button>
          </div>

          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            onClick={onRun}
            disabled={isRunning || !url}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {isRunning ? "Executing Nodes..." : "Run Full Workflow"}
          </button>
        </div>
      </div>

      {/* Input Bar & Presets */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Quick Test Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {TEST_BENCH_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => onUrlChange(preset.url)}
                type="button"
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  url === preset.url
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            id="test-bench-url-input"
            aria-label={t("pasteUrlPlaceholder")}
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={t("pasteUrlPlaceholder")}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
          <Activity className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Total Nodes</div>
            <div className="text-sm font-bold text-[var(--text)]">{totalNodes} Nodes</div>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Completed Nodes</div>
            <div className="text-sm font-bold text-emerald-400">{completedNodes} / {totalNodes}</div>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
          <Terminal className="h-5 w-5 text-purple-400" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Logged Events</div>
            <div className="text-sm font-bold text-purple-400">{totalLogs} Events</div>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <div>
            <div className="text-[10px] text-[var(--text-muted)]">Execution Duration</div>
            <div className="text-sm font-bold text-amber-400">
              {durationMs !== null ? `${durationMs}ms` : isRunning ? "Running..." : "Idle"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
