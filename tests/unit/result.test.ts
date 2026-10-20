import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr } from "@/lib/result";

describe("Result<T, E> Pattern", () => {
  it("constructs and identifies successful results", () => {
    const res = ok({ id: "run-123", status: "completed" });
    expect(isOk(res)).toBe(true);
    expect(isErr(res)).toBe(false);
    if (isOk(res)) {
      expect(res.data.id).toBe("run-123");
    }
  });

  it("constructs and identifies error results", () => {
    const res = err(new Error("Database offline"));
    expect(isOk(res)).toBe(false);
    expect(isErr(res)).toBe(true);
    if (isErr(res)) {
      expect(res.error.message).toBe("Database offline");
    }
  });
});
