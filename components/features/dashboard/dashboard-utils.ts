import type { JobRun } from "@/lib/db/schema/job-runs";
import type { StructuredReport, OpportunityMetadata } from "@/lib/validation/report";

/**
 * Creates an in-memory JobRun entry from a freshly streamed report completion event.
 */
export function createCompletedRunItem(
  runId: string | undefined,
  url: string,
  report: StructuredReport,
  metadata: OpportunityMetadata,
  telegramReport?: string | null
): JobRun {
  return {
    id: runId || `run_${Date.now()}`,
    userId: "current_user",
    workflowId: "job-xray",
    channel: "web",
    status: "completed",
    errorCode: null,
    errorMessage: null,
    input: { url, normalizedUrl: url },
    output: { report: { ...report, metadata }, telegramReport: telegramReport || null },
    usage: null,
    usageConsumedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Synchronizes the active report runId across the URL query (?runId=...) and sessionStorage.
 */
export function syncActiveRunUrl(runId: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (runId) {
      url.searchParams.set("runId", runId);
      sessionStorage.setItem("active_dashboard_run_id", runId);
    } else {
      url.searchParams.delete("runId");
      sessionStorage.removeItem("active_dashboard_run_id");
    }
    window.history.replaceState({}, "", url.toString());
  } catch {
    // Non-blocking navigation sync failure
  }
}

/**
 * Resolves the initial active run and its ID from SSR props, URL search parameters,
 * or sessionStorage without causing client-side cascading renders.
 */
export function resolveInitialRun(
  initialSelectedRunId: string | undefined,
  runs: JobRun[]
): {
  run: JobRun | undefined;
  runId: string | undefined;
} {
  let targetId = initialSelectedRunId;
  if (!targetId && typeof window !== "undefined") {
    try {
      const sp = new URLSearchParams(window.location.search);
      targetId = sp.get("runId") || sessionStorage.getItem("active_dashboard_run_id") || undefined;
    } catch {
      // Non-blocking
    }
  }
  const match = targetId ? runs.find((r) => r.id === targetId) : undefined;
  return { run: match, runId: match ? match.id : targetId };
}

export function extractReportFromRun(run: JobRun | undefined): StructuredReport | null {
  if (!run) return null;
  const output = run.output as Record<string, unknown> | null;
  return (output?.report ?? (run as unknown as { report?: unknown })?.report) as StructuredReport | null;
}

export function extractMetadataFromRun(run: JobRun | undefined): OpportunityMetadata | null {
  const report = extractReportFromRun(run);
  return (report as { metadata?: OpportunityMetadata })?.metadata || null;
}

export function extractUrlFromRun(run: JobRun | undefined): string | undefined {
  if (!run) return undefined;
  return ((run.input as Record<string, unknown>)?.url as string) || (run as unknown as { url?: string })?.url;
}

/**
 * Triggers the Gmail compose draft creation API and returns the created draft URL.
 */
export async function requestDraftUrl(
  metadata: OpportunityMetadata,
  defaultRole?: string,
  defaultCompany?: string
): Promise<string | undefined> {
  const res = await fetch("/api/test-bench/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: metadata.role || defaultRole || "Job Opportunity",
      company: metadata.company || defaultCompany || "Company",
      hrName: metadata.hrName,
      hrEmail: metadata.hrEmail,
    }),
  });
  const data = await res.json();
  return data.draftUrl;
}
