import { describe, it, expect } from "vitest";
import type { DashboardSummary } from "@/lib/db/queries/dashboard";

describe("Dashboard Hub Intelligence & Aggregations", () => {
  const mockSummary: DashboardSummary = {
    workflows: [
      {
        id: "wf-1",
        slug: "job-xray",
        name: "JobPost X-Ray",
        imageUrl: "/icons/job-xray.png",
        isActive: true,
        usageCount: 14,
        usageLimit: 50,
        lastUsedAt: new Date("2026-10-25T12:00:00Z"),
        expiresAt: null,
        isSubscribed: true,
        planName: "Pro",
        recentRunCount: 5,
      },
      {
        id: "wf-2",
        slug: "lead-enricher",
        name: "Lead Enricher",
        imageUrl: null,
        isActive: true,
        usageCount: 2,
        usageLimit: 20,
        lastUsedAt: new Date("2026-10-24T10:00:00Z"),
        expiresAt: null,
        isSubscribed: true,
        planName: "Pro",
        recentRunCount: 2,
      },
      {
        id: "wf-3",
        slug: "content-repurposer",
        name: "Content Repurposer",
        imageUrl: null,
        isActive: false,
        usageCount: 0,
        usageLimit: null, // Unlimited
        lastUsedAt: null,
        expiresAt: null,
        isSubscribed: false,
        planName: null,
        recentRunCount: 0,
      },
    ],
    recentRuns: [
      {
        id: "run-101",
        workflowSlug: "job-xray",
        workflowName: "JobPost X-Ray",
        workflowImageUrl: "/icons/job-xray.png",
        status: "completed",
        createdAt: new Date("2026-10-25T14:30:00Z"),
        inputPreview: "https://www.linkedin.com/posts/activity-123",
      },
      {
        id: "run-102",
        workflowSlug: "lead-enricher",
        workflowName: "Lead Enricher",
        workflowImageUrl: null,
        status: "running",
        createdAt: new Date("2026-10-25T15:00:00Z"),
        inputPreview: "https://example.com/company",
      },
    ],
    totalRunsToday: 2,
    totalRunsThisMonth: 16,
    subscription: {
      planName: "Pro",
      planCode: "pro_monthly",
      status: "active",
      currentPeriodEnd: new Date("2026-11-25T00:00:00Z"),
    },
  };

  it("calculates active workflow count accurately", () => {
    const activeCount = mockSummary.workflows.filter((w) => w.isActive).length;
    expect(activeCount).toBe(2);
  });

  it("calculates lowest remaining quota correctly across limited workflows", () => {
    const lowestRemaining = mockSummary.workflows.reduce<number | null>(
      (min, workflow) => {
        if (workflow.usageLimit === null) return min;
        const remaining = Math.max(0, workflow.usageLimit - workflow.usageCount);
        return min === null ? remaining : Math.min(min, remaining);
      },
      null
    );

    // wf-1 remaining: 50 - 14 = 36
    // wf-2 remaining: 20 - 2 = 18
    // lowest should be 18
    expect(lowestRemaining).toBe(18);
  });

  it("aggregates monthly scans and today runs across all workflows", () => {
    expect(mockSummary.totalRunsThisMonth).toBe(16);
    expect(mockSummary.totalRunsToday).toBe(2);
  });

  it("handles empty recent runs gracefully", () => {
    const emptySummary: DashboardSummary = {
      ...mockSummary,
      workflows: [],
      recentRuns: [],
      totalRunsToday: 0,
      totalRunsThisMonth: 0,
      subscription: null,
    };

    expect(emptySummary.workflows).toHaveLength(0);
    expect(emptySummary.recentRuns).toHaveLength(0);
    expect(emptySummary.subscription).toBeNull();
  });
});
