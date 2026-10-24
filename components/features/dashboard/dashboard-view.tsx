"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import type { JobRun } from "@/lib/db/schema/job-runs";
import type { StructuredReport, OpportunityMetadata } from "@/lib/validation/report";
import { QuickScanBar } from "./quick-scan-bar";
import { AnalysisStepper } from "./analysis-stepper";
import { StructuredReportCard } from "../report/structured-report-card";
import { HistoryArchive } from "./history-archive";
import { EmailPromptModal } from "../test-bench/email-prompt-modal";
import { DeleteReportModal } from "./delete-report-modal";
import { deleteJobRunAction } from "@/lib/actions/analyze";
import {
  createCompletedRunItem,
  syncActiveRunUrl,
  resolveInitialRun,
  requestDraftUrl,
  extractReportFromRun,
  extractMetadataFromRun,
  extractUrlFromRun,
} from "./dashboard-utils";

interface DashboardViewProps {
  initialRuns: JobRun[];
  initialQuota: number | null;
  preferredLanguage?: "ar" | "en";
  initialSelectedRunId?: string;
  isSubscribed?: boolean;
}

export function DashboardView({
  initialRuns,
  initialQuota,
  preferredLanguage = "ar",
  initialSelectedRunId,
  isSubscribed = false,
}: DashboardViewProps) {
  const [runsList, setRunsList] = useState<JobRun[]>(initialRuns);
  const [quota, setQuota] = useState<number | null>(initialQuota);
  const [isScanning, setIsScanning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("pending");
  const [scanError, setScanError] = useState<string | null>(null);

  const initialResolved = resolveInitialRun(initialSelectedRunId, initialRuns);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(initialResolved.runId);
  const [activeReport, setActiveReport] = useState<StructuredReport | null>(
    () => extractReportFromRun(initialResolved.run)
  );
  const [activeMetadata, setActiveMetadata] = useState<OpportunityMetadata | null>(
    () => extractMetadataFromRun(initialResolved.run)
  );
  const [activeSourceUrl, setActiveSourceUrl] = useState<string | undefined>(
    () => extractUrlFromRun(initialResolved.run)
  );

  useEffect(() => {
    if (selectedRunId) syncActiveRunUrl(selectedRunId);
  }, [selectedRunId]);

  const [deleteTargetRun, setDeleteTargetRun] = useState<JobRun | null>(null);
  const [isDeletingRun, setIsDeletingRun] = useState(false);
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
              syncActiveRunUrl(event.runId);

              if (typeof event.remainingQuota === "number") {
                setQuota(event.remainingQuota);
              }

              const newRunItem = createCompletedRunItem(
                event.runId,
                url,
                completedReport,
                completedMetadata,
                event.report?.telegramReport
              );
              setRunsList((prev) => [newRunItem, ...prev]);

              setTimeout(() => {
                reportRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 150);
            } else if (event.type === "error") {
              setScanError(event.message || "Pipeline execution failed");
            }
          } catch {
            // Non-blocking JSON parse fallback
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
    const rep = extractReportFromRun(run);
    if (!rep) return;
    setActiveReport(rep);
    setActiveMetadata(extractMetadataFromRun(run));
    setActiveSourceUrl(extractUrlFromRun(run));
    setSelectedRunId(run.id);
    syncActiveRunUrl(run.id);

    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCreateDraft = async () => {
    if (!activeMetadata?.hrEmail || isDrafting) return;
    setIsDrafting(true);
    try {
      const draft = await requestDraftUrl(
        activeMetadata,
        activeReport?.role?.title,
        activeReport?.company?.name
      );
      if (draft) setDraftUrl(draft);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetRun || isDeletingRun) return;
    setIsDeletingRun(true);
    try {
      const res = await deleteJobRunAction(deleteTargetRun.id);
      if (res.success) {
        setRunsList((prev) => prev.filter((r) => r.id !== deleteTargetRun.id));
        if (selectedRunId === deleteTargetRun.id) {
          setActiveReport(null);
          setActiveMetadata(null);
          setActiveSourceUrl(undefined);
          setSelectedRunId(undefined);
          syncActiveRunUrl(undefined);
        }
        setDeleteTargetRun(null);
      } else {
        setScanError(res.message);
      }
    } catch {
      setScanError("Failed to delete report. Please try again.");
    } finally {
      setIsDeletingRun(false);
    }
  };

  const deleteReport = extractReportFromRun(deleteTargetRun ?? undefined);

  return (
    <div className="space-y-8 pb-16">
      <QuickScanBar
        onScan={handleStartScan}
        isScanning={isScanning}
        remainingQuota={quota}
        preferredLanguage={preferredLanguage}
        isSubscribed={isSubscribed}
      />

      {isScanning && <AnalysisStepper currentStatus={currentStatus} />}

      {scanError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{scanError}</span>
        </div>
      )}

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
              setActiveMetadata(null);
              setActiveSourceUrl(undefined);
              setSelectedRunId(undefined);
              syncActiveRunUrl(undefined);
            }}
          />
        </div>
      )}

      <HistoryArchive
        runs={runsList}
        selectedRunId={selectedRunId}
        onSelectRun={handleSelectPastRun}
        onDeleteRun={(run) => setDeleteTargetRun(run)}
      />

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

      {deleteTargetRun && (
        <DeleteReportModal
          isOpen={Boolean(deleteTargetRun)}
          onClose={() => {
            if (!isDeletingRun) setDeleteTargetRun(null);
          }}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingRun}
          roleTitle={deleteReport?.role?.title}
          companyName={deleteReport?.role?.company}
        />
      )}
    </div>
  );
}
