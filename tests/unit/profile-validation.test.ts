import { describe, it, expect } from "vitest";
import { profileUpdateSchema, workflowMetadataSchema } from "@/lib/validation/profile";

describe("Profile validation schemas", () => {
  describe("profileUpdateSchema", () => {
    it("validates valid profile inputs", () => {
      const valid = { fullName: "Zaid Ali", preferredLanguage: "ar" };
      const res = profileUpdateSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("rejects names shorter than 2 chars", () => {
      const res = profileUpdateSchema.safeParse({
        fullName: "Z",
        preferredLanguage: "en",
      });
      expect(res.success).toBe(false);
    });

    it("rejects invalid languages", () => {
      const res = profileUpdateSchema.safeParse({
        fullName: "Zaid Ali",
        preferredLanguage: "fr",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("workflowMetadataSchema", () => {
    it("validates valid workflow preferences", () => {
      const res = workflowMetadataSchema.safeParse({
        fullName: "Zaid Ali",
        cv: "https://drive.google.com/file/d/12345/view",
        sendEmail: true,
      });
      expect(res.success).toBe(true);
    });

    it("allows empty cv string", () => {
      const res = workflowMetadataSchema.safeParse({
        cv: "",
        sendEmail: false,
      });
      expect(res.success).toBe(true);
    });

    it("rejects non-url cv strings", () => {
      const res = workflowMetadataSchema.safeParse({
        cv: "not-a-valid-url",
        sendEmail: true,
      });
      expect(res.success).toBe(false);
    });
  });
});
