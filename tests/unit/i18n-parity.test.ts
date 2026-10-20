import { describe, it, expect } from "vitest";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

function getNestedKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getNestedKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("i18n Translation Key Parity", () => {
  it("en.json and ar.json have identical translation keys", () => {
    const enKeys = getNestedKeys(enMessages);
    const arKeys = getNestedKeys(arMessages);

    const missingInAr = enKeys.filter((k) => !arKeys.includes(k));
    const extraInAr = arKeys.filter((k) => !enKeys.includes(k));

    expect(missingInAr).toEqual([]);
    expect(extraInAr).toEqual([]);
    expect(enKeys).toEqual(arKeys);
  });
});
