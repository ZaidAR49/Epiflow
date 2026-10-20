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
    channel: "web",
    url,
    normalizedUrl: url,
    status: "completed",
    postData: null,
    authorData: null,
    companyData: null,
    report: { ...report, metadata },
    telegramReport: telegramReport || null,
    errorCode: null,
    errorMessage: null,
    usageConsumedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Synchronizes the active report runId across the URL query (?runId=...) and sessionStorage
 * so the active report survives language switches and page transitions.
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
    const cleanSearch = url.search ? url.search : "";
    window.history.replaceState(null, "", url.pathname + cleanSearch);
  } catch {
    // Non-blocking in restricted browser contexts
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


