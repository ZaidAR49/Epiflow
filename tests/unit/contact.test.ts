import { describe, it, expect, vi } from "vitest";
import { contactFormSchema } from "@/lib/validation/contact";
import { submitContactAction } from "@/lib/actions/contact";

// Mock the email sending service
vi.mock("@/lib/services/email/contact-email", () => ({
  sendContactEmail: vi.fn().mockImplementation(async () => {
    return {
      success: true,
      data: {
        messageId: "mock-message-123",
        isSimulated: true,
      },
    };
  }),
}));

describe("Contact Form Validation Schema", () => {
  it("validates valid input correctly", () => {
    const validData = {
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      category: "support",
      subject: "Workflow Question",
      message: "Hello, I would like to ask about custom LinkedIn scrapers for our team.",
      website: "",
    };

    const parsed = contactFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Ahmed Hassan");
      expect(parsed.data.email).toBe("ahmed@example.com");
      expect(parsed.data.category).toBe("support");
    }
  });

  it("fails on invalid email address", () => {
    const invalidData = {
      name: "Ahmed Hassan",
      email: "not-an-email",
      category: "general",
      subject: "Valid subject",
      message: "This is a valid length message for testing.",
      website: "",
    };

    const parsed = contactFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("fails when name is too short", () => {
    const invalidData = {
      name: "A",
      email: "ahmed@example.com",
      category: "general",
      subject: "Valid subject",
      message: "This is a valid length message for testing.",
      website: "",
    };

    const parsed = contactFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("fails when message is too short", () => {
    const invalidData = {
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      category: "general",
      subject: "Valid subject",
      message: "Too short",
      website: "",
    };

    const parsed = contactFormSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("defaults category to general when omitted", () => {
    const minimalData = {
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      subject: "Inquiry about partnership",
      message: "We would like to integrate EpiFlow intelligence with our platform.",
    };

    const parsed = contactFormSchema.safeParse(minimalData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe("general");
    }
  });
});

describe("Contact Server Action", () => {
  it("rejects invalid input with validation error", async () => {
    const result = await submitContactAction({
      name: "",
      email: "invalid",
      subject: "",
      message: "",
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VALIDATION_ERROR");
  });

  it("silently drops honeypot submission from spam bots", async () => {
    const result = await submitContactAction({
      name: "Spam Bot",
      email: "bot@spammer.com",
      category: "general",
      subject: "Buy cheap backlinks now",
      message: "Click this malicious link to buy backlinks immediately today.",
      website: "https://spam-link.com", // Honeypot filled by bot
    });

    expect(result.success).toBe(true);
    expect(result.isSimulated).toBe(false);
  });

  it("successfully processes valid submissions", async () => {
    const result = await submitContactAction({
      name: "Karim Zaid",
      email: "karim@example.com",
      category: "partnership",
      subject: "Enterprise API Partnership",
      message: "We are interested in high-volume automated workflow licenses.",
      website: "",
    });

    expect(result.success).toBe(true);
    expect(result.isSimulated).toBe(true);
  });
});
