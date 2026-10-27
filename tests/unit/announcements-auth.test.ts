import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActiveAnnouncementsAction } from "@/lib/actions/announcements";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db/queries/system-announcements", () => ({
  getActiveAnnouncements: vi.fn().mockResolvedValue([
    {
      id: "11111111-1111-4111-a111-111111111111",
      type: "update",
      titleEn: "System Update",
      titleAr: "تحديث للنظام",
      severity: "info",
      isActive: true,
      startsAt: new Date(),
      endsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      bodyEn: null,
      bodyAr: null,
    },
  ]),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("getActiveAnnouncementsAction Authentication Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated caller without querying database", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await getActiveAnnouncementsAction();

    expect(result.success).toBe(false);
    expect(result.announcements).toEqual([]);

    const { getActiveAnnouncements } = await import(
      "@/lib/db/queries/system-announcements"
    );
    expect(getActiveAnnouncements).not.toHaveBeenCalled();
  });

  it("allows authenticated user to receive active announcements", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-123", email: "user@example.com", role: "user" },
    } as never);

    const result = await getActiveAnnouncementsAction();

    expect(result.success).toBe(true);
    expect(result.announcements.length).toBe(1);
    expect(result.announcements[0]?.titleEn).toBe("System Update");
  });
});
