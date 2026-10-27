import { describe, it, expect } from "vitest";
import {
  createAnnouncementSchema,
  sendNotificationSchema,
  toggleAnnouncementSchema,
  deleteAnnouncementSchema,
} from "@/lib/validation/notifications";

describe("Notifications & System Announcements Validation", () => {
  describe("createAnnouncementSchema", () => {
    it("validates valid announcement with English title", () => {
      const result = createAnnouncementSchema.safeParse({
        type: "update",
        severity: "info",
        titleEn: "New Feature Launched",
        isActive: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("update");
        expect(result.data.severity).toBe("info");
        expect(result.data.titleEn).toBe("New Feature Launched");
      }
    });

    it("validates valid announcement with Arabic title only", () => {
      const result = createAnnouncementSchema.safeParse({
        type: "maintenance",
        severity: "warning",
        titleAr: "صيانة مجدولة للنظام",
        bodyAr: "سيتوقف النظام لمدة ساعتين",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.titleAr).toBe("صيانة مجدولة للنظام");
      }
    });

    it("rejects announcement when both titles are empty", () => {
      const result = createAnnouncementSchema.safeParse({
        type: "message",
        severity: "info",
        titleAr: "   ",
        titleEn: "",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid announcement type", () => {
      const result = createAnnouncementSchema.safeParse({
        type: "invalid_type",
        titleEn: "Hello",
      });

      expect(result.success).toBe(false);
    });

    it("rejects endsAt earlier than startsAt", () => {
      const result = createAnnouncementSchema.safeParse({
        type: "maintenance",
        titleEn: "Scheduled Downtime",
        startsAt: "2026-10-27T12:00:00Z",
        endsAt: "2026-10-27T10:00:00Z",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("sendNotificationSchema", () => {
    it("validates broadcast notification to all users", () => {
      const result = sendNotificationSchema.safeParse({
        recipientMode: "broadcast",
        type: "update",
        title: "Platform Upgrade Complete",
        body: "All features are operational.",
        link: "/dashboard",
      });

      expect(result.success).toBe(true);
    });

    it("validates single-user notification with valid UUID", () => {
      const result = sendNotificationSchema.safeParse({
        recipientMode: "single",
        userId: "11111111-1111-4111-a111-111111111111",
        type: "access_approved",
        title: "Your access has been approved!",
        link: "https://epiflow.io",
      });

      expect(result.success).toBe(true);
    });

    it("rejects single-user notification missing userId", () => {
      const result = sendNotificationSchema.safeParse({
        recipientMode: "single",
        type: "access_approved",
        title: "Your access has been approved!",
      });

      expect(result.success).toBe(false);
    });

    it("rejects link that does not start with / or https://", () => {
      const result = sendNotificationSchema.safeParse({
        recipientMode: "broadcast",
        type: "update",
        title: "Check this out",
        link: "javascript:alert(1)",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = sendNotificationSchema.safeParse({
        recipientMode: "broadcast",
        type: "general",
        title: "   ",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("toggle & delete schemas", () => {
    it("validates toggleAnnouncementSchema with valid UUID", () => {
      const result = toggleAnnouncementSchema.safeParse({
        id: "22222222-2222-4222-a222-222222222222",
        isActive: false,
      });

      expect(result.success).toBe(true);
    });

    it("validates deleteAnnouncementSchema with valid UUID", () => {
      const result = deleteAnnouncementSchema.safeParse({
        id: "22222222-2222-4222-a222-222222222222",
      });

      expect(result.success).toBe(true);
    });

    it("rejects non-UUID id", () => {
      const result = deleteAnnouncementSchema.safeParse({
        id: "not-a-uuid",
      });

      expect(result.success).toBe(false);
    });
  });
});
