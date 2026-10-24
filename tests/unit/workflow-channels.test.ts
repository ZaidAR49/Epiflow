import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@/lib/db/schema/users";
import {
  saveWorkflowChannelSchema,
  deleteWorkflowChannelSchema,
} from "@/lib/validation/workflow-channels";

// Mock auth module
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock queries
vi.mock("@/lib/db/queries/users", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/lib/db/queries/workflow-channels", () => ({
  upsertWorkflowChannel: vi.fn(),
  deleteWorkflowChannel: vi.fn(),
  getWorkflowChannels: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import {
  upsertWorkflowChannel,
  deleteWorkflowChannel,
} from "@/lib/db/queries/workflow-channels";
import {
  saveWorkflowChannelAction,
  deleteWorkflowChannelAction,
} from "@/lib/actions/workflow-channels";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Workflow Channels Management", () => {
  const adminId = "11111111-1111-4111-a111-111111111111";
  const userId = "22222222-2222-4222-a222-222222222222";
  const workflowId = "33333333-3333-4333-a333-333333333333";
  const channelId = "44444444-4444-4444-a444-444444444444";

  const adminSession = {
    user: { id: adminId, role: "admin", name: "Admin" },
    expires: "2099-01-01",
  };

  const userSession = {
    user: { id: userId, role: "user", name: "User" },
    expires: "2099-01-01",
  };

  function createMockUser(overrides: Partial<User>): User {
    return {
      id: userId,
      email: "test@example.com",
      fullName: "Test User",
      role: "user",
      status: "approved",
      emailVerified: true,
      reasonForAccess: null,
      preferredLanguage: "ar",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("strips leading @ from handle automatically", () => {
      const res = saveWorkflowChannelSchema.safeParse({
        workflowId,
        channel: "telegram",
        handle: "@MyAwesomeBot",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.handle).toBe("MyAwesomeBot");
        expect(res.data.channel).toBe("telegram");
      }
    });

    it("rejects empty handle", () => {
      const res = saveWorkflowChannelSchema.safeParse({
        workflowId,
        channel: "telegram",
        handle: "   ",
      });
      expect(res.success).toBe(false);
    });

    it("validates direct URLs", () => {
      const res = saveWorkflowChannelSchema.safeParse({
        workflowId,
        channel: "telegram",
        handle: "Bot",
        url: "not-a-valid-url",
      });
      expect(res.success).toBe(false);

      const validRes = saveWorkflowChannelSchema.safeParse({
        workflowId,
        channel: "telegram",
        handle: "Bot",
        url: "https://t.me/Bot",
      });
      expect(validRes.success).toBe(true);
    });

    it("validates deleteWorkflowChannelSchema requires valid UUIDs", () => {
      const invalid = deleteWorkflowChannelSchema.safeParse({
        channelId: "not-uuid",
        workflowId,
      });
      expect(invalid.success).toBe(false);

      const valid = deleteWorkflowChannelSchema.safeParse({
        channelId,
        workflowId,
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("saveWorkflowChannelAction", () => {
    it("rejects unauthorized requests without session", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const res = await saveWorkflowChannelAction({
        workflowId,
        channel: "telegram",
        handle: "MyBot",
        isActive: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("rejects non-admin users", async () => {
      mockAuth.mockResolvedValueOnce(userSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: userId, role: "user", status: "approved" })
      );

      const res = await saveWorkflowChannelAction({
        workflowId,
        channel: "telegram",
        handle: "MyBot",
        isActive: true,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin privileges required");
    });

    it("auto-generates telegram canonical url if omitted and persists channel", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: adminId, role: "admin", status: "approved" })
      );

      vi.mocked(upsertWorkflowChannel).mockResolvedValueOnce({
        id: channelId,
        workflowId,
        channel: "telegram",
        handle: "MyBot",
        url: "https://t.me/MyBot",
        isActive: true,
        createdAt: new Date(),
      });

      const res = await saveWorkflowChannelAction({
        workflowId,
        channel: "telegram",
        handle: "@MyBot",
        isActive: true,
      });

      expect(res.success).toBe(true);
      expect(upsertWorkflowChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          channel: "telegram",
          handle: "MyBot",
          url: "https://t.me/MyBot",
          isActive: true,
        })
      );
    });
  });

  describe("deleteWorkflowChannelAction", () => {
    it("rejects non-admin users", async () => {
      mockAuth.mockResolvedValueOnce(userSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: userId, role: "user", status: "approved" })
      );

      const res = await deleteWorkflowChannelAction({
        channelId,
        workflowId,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin privileges required");
    });

    it("deletes channel when requested by verified admin", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: adminId, role: "admin", status: "approved" })
      );
      vi.mocked(deleteWorkflowChannel).mockResolvedValueOnce(true);

      const res = await deleteWorkflowChannelAction({
        channelId,
        workflowId,
      });
      expect(res.success).toBe(true);
      expect(deleteWorkflowChannel).toHaveBeenCalledWith(channelId, workflowId);
    });
  });
});
