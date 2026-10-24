import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@/lib/db/schema/users";

// Mock auth module
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock queries
vi.mock("@/lib/db/queries/users", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/lib/db/queries/admin", () => ({
  updateWorkflowDetails: vi.fn(),
  updateUserRoleAndStatus: vi.fn(),
  updateUserWorkflowQuota: vi.fn(),
  getActiveAdminCount: vi.fn(),
  deleteUserById: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/auth";
import { getUserById } from "@/lib/db/queries/users";
import {
  getActiveAdminCount,
  deleteUserById,
  updateUserRoleAndStatus,
} from "@/lib/db/queries/admin";
import { updateUserStatusAction, deleteUserAction } from "@/lib/actions/admin";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe("Security & Authorization Controls", () => {
  const adminId = "11111111-1111-4111-a111-111111111111";
  const userId = "22222222-2222-4222-a222-222222222222";
  const otherAdminId = "33333333-3333-4333-a333-333333333333";

  const adminSession = {
    user: { id: adminId, role: "admin", name: "Admin" },
    expires: "2099-01-01",
  };

  const normalUserSession = {
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

  describe("updateUserStatusAction", () => {
    it("rejects unauthorized callers without session", async () => {
      mockAuth.mockResolvedValueOnce(null);
      const res = await updateUserStatusAction({
        userId,
        role: "admin",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
    });

    it("rejects non-admin callers even if session is present", async () => {
      mockAuth.mockResolvedValueOnce(normalUserSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: userId, role: "user", status: "approved" })
      );

      const res = await updateUserStatusAction({
        userId: otherAdminId,
        role: "admin",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin privileges required");
    });

    it("prevents demoting the last active administrator", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      // Caller is admin in DB
      vi.mocked(getUserById)
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }))
        // Target user is admin
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }));

      // Only 1 active admin exists
      vi.mocked(getActiveAdminCount).mockResolvedValueOnce(1);

      const res = await updateUserStatusAction({
        userId: adminId,
        role: "user",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("only administrator");
    });

    it("allows demoting an administrator when another administrator exists", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      vi.mocked(getUserById)
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }))
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }));

      // 2 active admins exist
      vi.mocked(getActiveAdminCount).mockResolvedValueOnce(2);
      vi.mocked(updateUserRoleAndStatus).mockResolvedValueOnce(true);

      const res = await updateUserStatusAction({
        userId: adminId,
        role: "user",
      });

      expect(res.success).toBe(true);
    });
  });

  describe("deleteUserAction", () => {
    it("prevents non-admins from deleting users", async () => {
      mockAuth.mockResolvedValueOnce(normalUserSession);
      vi.mocked(getUserById).mockResolvedValueOnce(
        createMockUser({ id: userId, role: "user", status: "approved" })
      );

      const res = await deleteUserAction({
        userId: otherAdminId,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Admin privileges required");
    });

    it("prevents deleting an administrator if they are the only administrator", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      vi.mocked(getUserById)
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }))
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }));

      vi.mocked(getActiveAdminCount).mockResolvedValueOnce(1);

      const res = await deleteUserAction({
        userId: adminId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("only administrator");
    });

    it("allows deleting an administrator when another administrator exists", async () => {
      mockAuth.mockResolvedValueOnce(adminSession);
      vi.mocked(getUserById)
        .mockResolvedValueOnce(createMockUser({ id: adminId, role: "admin", status: "approved" }))
        .mockResolvedValueOnce(createMockUser({ id: otherAdminId, role: "admin", status: "approved" }));

      vi.mocked(getActiveAdminCount).mockResolvedValueOnce(2);
      vi.mocked(deleteUserById).mockResolvedValueOnce(true);

      const res = await deleteUserAction({
        userId: otherAdminId,
      });

      expect(res.success).toBe(true);
    });
  });
});
