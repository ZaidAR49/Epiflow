"use client";

import React, { useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import type { JobRun } from "@/lib/db/schema/job-runs";
import type { StructuredReport, OpportunityMetadata } from "@/lib/validation/report";
import { QuickScanBar } from "./quick-scan-bar";
import { AnalysisStepper } from "./analysis-stepper";
import { StructuredReportCard } from "../report/structured-report-card";
import { HistoryArchive } from "./history-archive";
import { EmailPromptModal } from "../test-bench/email-prompt-modal";

interface DashboardViewProps {
  initialRuns: JobRun[];
  initialQuota: number | null;
  preferredLanguage?: "ar" | "en";
}

export function DashboardView({
  initialRuns,
  initialQuota,
  preferredLanguage = "ar",
}: DashboardViewProps) {
  const [runsList, setRunsList] = useState<JobRun[]>(initialRuns);
  const [quota, setQuota] = useState<number | null>(initialQuota);
  const [isScanning, setIsScanning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("pending");
  const [scanError, setScanError] = useState<string | null>(null);

  // Active / Selected Report State
  const [activeReport, setActiveReport] = useState<StructuredReport | null>(null);
  const [activeMetadata, setActiveMetadata] = useState<OpportunityMetadata | null>(null);
  const [activeSourceUrl, setActiveSourceUrl] = useState<string | undefined>(undefined);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);

  // Draft Modal State
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftUrl, setDraftUrl] = useState<string | undefined>(undefined);

  const reportRef = useRef<HTMLDivElement>(null);

  const handleStartScan = async (url: string, language: "ar" | "en") => {
    if (isScanning) return;

    setIsScanning(true);
    setCurrentStatus("validating");
    setScanError(null);
    setActiveReport(null);
    setSelectedRunId(undefined);

    try {
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Request failed with HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === "progress") {
              setCurrentStatus(event.status);
            } else if (event.type === "completed") {
              const completedReport = event.report?.report as StructuredReport;
              const completedMetadata = event.report?.metadata as OpportunityMetadata;

              setActiveReport(completedReport);
              setActiveMetadata(completedMetadata);
              setActiveSourceUrl(url);
              setSelectedRunId(event.runId);

              if (typeof event.remainingQuota === "number") {
                setQuota(event.remainingQuota);
              }

              // Prepend newly completed run into history list
              const newRunItem: JobRun = {
                id: event.runId || `run_${Date.now()}`,
                userId: "current_user",
                channel: "web",
                url,
                normalizedUrl: url,
                status: "completed",
                postData: null,
                authorData: null,
                companyData: null,
                report: { ...completedReport, metadata: completedMetadata },
                telegramReport: event.report?.telegramReport || null,
                errorCode: null,
                errorMessage: null,
                usageConsumedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setRunsList((prev) => [newRunItem, ...prev]);

              // Smoothly scroll down to the generated report
              setTimeout(() => {
                reportRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            } else if (event.type === "error") {
              setScanError(event.message || "Pipeline execution failed");
            }
          } catch {
            // Ignore parse hiccups on malformed chunks
          }
        }
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectPastRun = (run: JobRun) => {
    if (!run.report) return;
    const rep = run.report as StructuredReport & { metadata?: OpportunityMetadata };
    setActiveReport(rep);
    setActiveMetadata(rep.metadata || null);
    setActiveSourceUrl(run.url);
    setSelectedRunId(run.id);

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCreateDraft = async () => {
    if (!activeMetadata?.hrEmail || isDrafting) return;
    setIsDrafting(true);

    try {
      const res = await fetch("/api/test-bench/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeMetadata.role || activeReport?.role?.title || "Job Opportunity",
          company: activeMetadata.company || activeReport?.company?.name || "Company",
          hrName: activeMetadata.hrName,
          hrEmail: activeMetadata.hrEmail,
        }),
      });

      const data = await res.json();
      if (data.draftUrl) {
        setDraftUrl(data.draftUrl);
      }
    } catch {
      // Handled in modal
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Quick Scan Bar */}
      <QuickScanBar
        onScan={handleStartScan}
        isScanning={isScanning}
        remainingQuota={quota}
        preferredLanguage={preferredLanguage}
      />

      {/* 2. Analysis Stepper Progress */}
      {isScanning && (
        <AnalysisStepper currentStatus={currentStatus} />
      )}

      {/* Scan Error Message */}
      {scanError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{scanError}</span>
        </div>
      )}

      {/* 3. Active / Selected Report Viewer */}
      {activeReport && (
        <div ref={reportRef} className="pt-2 animate-in fade-in duration-200">
          <StructuredReportCard
            report={activeReport}
            metadata={activeMetadata || undefined}
            sourceUrl={activeSourceUrl}
            onDraftEmail={() => {
              setDraftUrl(undefined);
              setDraftModalOpen(true);
            }}
            onClose={() => {
              setActiveReport(null);
              setSelectedRunId(undefined);
            }}
          />
        </div>
      )}

      {/* 4. Analysis History & Saved Reports Archive */}
      <HistoryArchive
        runs={runsList}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectPastRun}
      />

      {/* 5. 1-Click Gmail Compose Modal */}
      {draftModalOpen && activeMetadata?.hrEmail && (
        <EmailPromptModal
          metadata={{
            role: activeMetadata.role,
            company: activeMetadata.company,
            hrName: activeMetadata.hrName,
            hrEmail: activeMetadata.hrEmail,
          }}
          onConfirm={handleCreateDraft}
          onDismiss={() => {
            setDraftModalOpen(false);
            setDraftUrl(undefined);
          }}
          draftUrl={draftUrl}
          isDrafting={isDrafting}
        />
      )}
    </div>
  );
}
