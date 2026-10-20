import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { isShortLinkedInUrl, normalizeLinkedInUrl } from "@/lib/validation/url";

const ALLOWED_HOSTS = new Set(["linkedin.com", "www.linkedin.com", "lnkd.in"]);

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isSafeHost(hostname: string): boolean {
  const cleanHost = hostname.toLowerCase();

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(cleanHost)) {
      return false;
    }
  }

  if (ALLOWED_HOSTS.has(cleanHost)) {
    return true;
  }

  // Allow subdomains of linkedin.com (e.g. eg.linkedin.com, sa.linkedin.com)
  if (cleanHost.endsWith(".linkedin.com")) {
    return true;
  }

  return false;
}

/**
 * Expands short URLs (e.g. lnkd.in) following redirects safely with SSRF protection.
 * Enforces hop limits, host allowlists, and timeouts.
 */
export async function expandLinkedInUrl(
  inputUrl: string,
  maxHops = 5
): Promise<Result<string, AppError>> {
  let currentUrl = inputUrl.trim();

  if (!isShortLinkedInUrl(currentUrl)) {
    return ok(normalizeLinkedInUrl(currentUrl));
  }

  let hops = 0;

  try {
    while (hops < maxHops) {
      let parsed: URL;
      try {
        parsed = new URL(currentUrl);
      } catch {
        return err(
          new AppError(ErrorCodes.INVALID_URL, 400, "Invalid URL structure")
        );
      }

      if (!isSafeHost(parsed.hostname)) {
        return err(
          new AppError(
            ErrorCodes.INVALID_URL,
            400,
            "URL host is not permitted by security policy"
          )
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const status = response.status;
      if (status >= 300 && status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          break;
        }

        // Handle relative redirects
        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;
        hops++;

        // If it resolved to a full linkedin post/job URL, stop following
        if (!isShortLinkedInUrl(currentUrl)) {
          break;
        }
      } else {
        break;
      }
    }

    return ok(normalizeLinkedInUrl(currentUrl));
  } catch (error) {
    return err(
      new AppError(
        ErrorCodes.INVALID_URL,
        400,
        "Failed to resolve short LinkedIn link",
        { cause: error }
      )
    );
  }
}
