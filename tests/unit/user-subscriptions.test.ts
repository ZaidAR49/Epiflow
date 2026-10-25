import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockCreateMockSubscription = vi.fn();
const mockCancelSubscription = vi.fn();
const mockGetUserSubscription = vi.fn();
const mockGetPlanById = vi.fn();

vi.mock("@/lib/db/queries/subscriptions", () => ({
  createMockSubscription: (...args: unknown[]) => mockCreateMockSubscription(...args),
  cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args),
  getUserSubscription: (...args: unknown[]) => mockGetUserSubscription(...args),
}));

vi.mock("@/lib/db/queries/plans", () => ({
  getPlanById: (...args: unknown[]) => mockGetPlanById(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    LEMONSQUEEZY_API_KEY: "",
    LEMONSQUEEZY_STORE_ID: "",
    LEMONSQUEEZY_WEBHOOK_SECRET: "",
    NEXT_PUBLIC_APP_NAME: "EpiFlow",
    NEXT_PUBLIC_PLATFORM_NAME: "epiflow",
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  mockSubscribeAction,
  cancelUserSubscriptionAction,
} from "@/lib/actions/subscriptions";

describe("User Subscription & Mock Checkout Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlanById.mockResolvedValue({
      id: "plan-123",
      code: "pro",
      name: "Pro Plan",
      priceMinor: 1900,
      currency: "USD",
      billingInterval: "month",
      trialDays: 0,
      provider: "mock",
      providerPriceId: null,
      entitlements: { "job-xray": { runs: 100 } },
      isActive: true,
    });
  });

  describe("mockSubscribeAction", () => {
    it("rejects unauthenticated users", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await mockSubscribeAction("plan-123");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockCreateMockSubscription).not.toHaveBeenCalled();
    });

    it("successfully creates a mock subscription for the authenticated user", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-456" },
      });

      mockCreateMockSubscription.mockResolvedValueOnce({
        subscriptionId: "sub-789",
      });

      const result = await mockSubscribeAction("plan-123");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.subscriptionId).toBe("sub-789");
      }
      expect(mockCreateMockSubscription).toHaveBeenCalledWith("user-456", "plan-123", 30);
    });

    it("handles creation failures gracefully", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-456" },
      });

      mockCreateMockSubscription.mockRejectedValueOnce(
        new Error("Database RPC failed")
      );

      const result = await mockSubscribeAction("plan-123");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database RPC failed");
    });
  });

  describe("cancelUserSubscriptionAction", () => {
    it("rejects unauthenticated users", async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await cancelUserSubscriptionAction("sub-789");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
      expect(mockCancelSubscription).not.toHaveBeenCalled();
    });

    it("rejects if the subscription does not belong to the user", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-456" },
      });

      mockGetUserSubscription.mockResolvedValueOnce({
        id: "different-sub-id",
        userId: "user-456",
      });

      const result = await cancelUserSubscriptionAction("sub-789");
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
      expect(mockCancelSubscription).not.toHaveBeenCalled();
    });

    it("successfully cancels subscription when user owns it", async () => {
      mockAuth.mockResolvedValueOnce({
        user: { id: "user-456" },
      });

      mockGetUserSubscription.mockResolvedValueOnce({
        id: "sub-789",
        userId: "user-456",
      });

      mockCancelSubscription.mockResolvedValueOnce(true);

      const result = await cancelUserSubscriptionAction("sub-789");
      expect(result.success).toBe(true);
      expect(mockCancelSubscription).toHaveBeenCalledWith("sub-789");
    });
  });
});
