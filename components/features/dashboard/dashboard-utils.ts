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
