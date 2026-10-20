import { z } from "zod";

/**
 * Standard LinkedIn URL pattern covering posts, feed updates, job listings, and lnkd.in short links.
 */
export const LINKEDIN_URL_REGEX =
  /((https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:posts|feed\/update|jobs\/view)\/[^\s?#]+)|(https?:\/\/lnkd\.in\/[^\s?#]+))/i;

export const LINKEDIN_SHORT_URL_REGEX = /^https?:\/\/lnkd\.in\/[a-zA-Z0-9_\-\/]+/i;

export const linkedinUrlSchema = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine(
    (url) => LINKEDIN_URL_REGEX.test(url),
    "Must be a LinkedIn post, job listing, or lnkd.in short link"
  );

export function isShortLinkedInUrl(url: string): boolean {
  return LINKEDIN_SHORT_URL_REGEX.test(url);
}

/**
 * Strips tracking parameters (utm_*, trackingId, etc.) while preserving the core canonical URL.
 */
export function normalizeLinkedInUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip common tracking and session parameters
    const paramsToKeep = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (
        !key.startsWith("utm_") &&
        key !== "trackingId" &&
        key !== "midSig" &&
        key !== "referenceId" &&
        key !== "trackingCode"
      ) {
        paramsToKeep.append(key, value);
      }
    }

    parsed.search = paramsToKeep.toString();
    parsed.hash = "";
    // Remove trailing slash for consistency
    const result = parsed.toString().replace(/\/$/, "");
    return result;
  } catch {
    return rawUrl;
  }
}
