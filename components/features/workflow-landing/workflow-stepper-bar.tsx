"use client";

import React from "react";

interface WorkflowStepperBarProps {
  stages: Array<{ num: string; category: string; label: string }>;
  currentStage: number;
  stackedMode: boolean;
  progress: number;
  onSelectStage: (stageIndex: number) => void;
}

export function WorkflowStepperBar({
  stages,
  currentStage,
  stackedMode,
  progress,
  onSelectStage,
}: WorkflowStepperBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-b hairline-border bg-[var(--bg)]/30">
      {stages.map((s, idx) => {
        const stageIndex = idx + 1;
        const isActive = currentStage === stageIndex && !stackedMode;
        const isFinished = currentStage > stageIndex && !stackedMode;
        const barWidth = isActive ? `${progress}%` : isFinished ? "100%" : "0%";
        const isLastOddItem = idx === 4;

        return (
          <button
            key={stageIndex}
            type="button"
            onClick={() => onSelectStage(stageIndex)}
            className={`text-start p-3 sm:p-4 lg:p-5 border-e border-b lg:border-b-0 hairline-border relative focus:outline-none transition-colors min-w-0 ${
              isLastOddItem ? "col-span-2 sm:col-span-1" : ""
            } ${
              isActive ? "bg-[var(--surface-2)]/70" : "hover:bg-[var(--surface-2)]/40"
            }`}
          >
            <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs mb-1">
              <span
                className={`font-semibold shrink-0 ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                }`}
              >
                {s.num}
              </span>
              <span className="text-[var(--text-muted)] text-[10px] sm:text-[11px] truncate ms-1">
                {s.category}
              </span>
            </div>
            <div
              className={`font-heading font-semibold text-xs sm:text-sm truncate ${
                isActive ? "text-[var(--text)]" : "text-[var(--text-muted)]"
              }`}
            >
              {s.label}
            </div>
            <div className="absolute bottom-0 inset-inline-start-0 inset-inline-end-0 h-0.5 bg-white/5">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-100 ease-linear"
                style={{ width: barWidth }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
