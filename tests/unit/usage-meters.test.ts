import { describe, it, expect } from "vitest";
import { createUsageMeterSchema } from "@/lib/validation/usage-meters";

describe("Usage Meter Validation Schema", () => {
  it("accepts valid meter definitions", () => {
    const validInputs = [
      { key: "runs", name: "Workflow Runs", unit: "runs" },
      { key: "ai_tokens", name: "AI Tokens", unit: "tokens" },
      { key: "storage_mb", name: "Cloud Storage", unit: "MB" },
      { key: "api-calls", name: "API Invocations", unit: "calls" },
      { key: "leads:captured", name: "Recruiter Leads", unit: "leads" },
    ];

    for (const input of validInputs) {
      const parsed = createUsageMeterSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects keys that do not start with a lowercase letter", () => {
    const invalidKeys = ["1runs", "Runs", "_tokens", "-meter", ":leads"];

    for (const key of invalidKeys) {
      const parsed = createUsageMeterSchema.safeParse({
        key,
        name: "Test Meter",
        unit: "unit",
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects keys with illegal characters", () => {
    const invalidKeys = ["runs with space", "token$", "meter@count", "runs.dot"];

    for (const key of invalidKeys) {
      const parsed = createUsageMeterSchema.safeParse({
        key,
        name: "Test Meter",
        unit: "unit",
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("rejects empty or excessively short names and units", () => {
    expect(
      createUsageMeterSchema.safeParse({
        key: "valid_key",
        name: "a", // < 2 chars
        unit: "unit",
      }).success
    ).toBe(false);

    expect(
      createUsageMeterSchema.safeParse({
        key: "valid_key",
        name: "Valid Name",
        unit: "", // empty
      }).success
    ).toBe(false);
  });
});
