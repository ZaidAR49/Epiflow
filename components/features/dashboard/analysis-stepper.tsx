"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Sparkles } from "lucide-react";

interface AnalysisStepperProps {
  currentStatus: string;
}

const STEPS = [
  { key: "validating", labelKey: "validating" },
  { key: "scraping_post", labelKey: "scrapingPost" },
  { key: "enrichment", labelKey: "scrapingAuthor" },
  { key: "generating_report", labelKey: "generating" },
] as const;

export function AnalysisStepper({ currentStatus }: AnalysisStepperProps) {
  const t = useTranslations("stepper");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStepState = (stepIndex: number) => {
    let activeIndex = 0;
    if (currentStatus === "validating" || currentStatus === "pending") {
      activeIndex = 0;
    } else if (currentStatus === "scraping_post") {
      activeIndex = 1;
    } else if (
      currentStatus === "scraping_author" ||
      currentStatus === "scraping_company"
    ) {
      activeIndex = 2;
    } else if (currentStatus === "generating_report") {
      activeIndex = 3;
    } else if (currentStatus === "completed") {
      activeIndex = 4;
    }

    if (activeIndex > stepIndex) return "completed";
    if (activeIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
          </div>
          <span className="text-sm font-bold text-[var(--text)]">
            Deep Intelligence Scan in Progress...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[var(--surface-2)] px-2.5 py-1 text-xs font-mono font-bold text-[var(--accent)] border border-[var(--border)]">
            {elapsedSeconds}s
          </span>
        </div>
      </div>

      {/* Steps visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {STEPS.map((step, idx) => {
          const state = getStepState(idx);
          const isCompleted = state === "completed";
          const isActive = state === "active";

          return (
            <div
              key={step.key}
              className={`flex items-center sm:flex-col sm:items-start gap-3 rounded-xl border p-3.5 transition-all ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/40 shadow-sm"
                  : isCompleted
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                  : "border-[var(--border)] bg-[var(--surface-2)]/40 text-[var(--text-muted)] opacity-60"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/30 animate-pulse"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="min-w-0">
                <p
                  className={`text-xs font-bold truncate ${
                    isActive
                      ? "text-[var(--accent)]"
                      : isCompleted
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {t(step.labelKey as "validating")}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isCompleted ? "Done" : isActive ? "Processing..." : "Queued"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
