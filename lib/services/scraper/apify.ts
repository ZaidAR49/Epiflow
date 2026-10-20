import "server-only";
import { ApifyClient } from "apify-client";
import { AppError, ErrorCodes } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { logger } from "@/lib/logger";
import {
  rawPostSchema,
  rawAuthorSchema,
  rawCompanySchema,
  type RawPostData,
  type RawAuthorData,
  type RawCompanyData,
} from "./types";

const POST_ACTOR_ID = process.env.APIFY_POST_ACTOR_ID || "d0DhjXPjkkwm4W5xK";
const AUTHOR_ACTOR_ID = process.env.APIFY_AUTHOR_ACTOR_ID || "LpVuK3Zozwuipa5bp";
const COMPANY_ACTOR_ID = process.env.APIFY_COMPANY_ACTOR_ID || "UwSdACBp7ymaGUJjS";

function getApifyClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new AppError(
      ErrorCodes.INTERNAL_ERROR,
      500,
      "APIFY_TOKEN is not configured"
    );
  }
  return new ApifyClient({ token });
}

/**
 * Scrapes a LinkedIn post by URL using Apify Post Actor.
 */
export async function scrapePost(url: string): Promise<Result<RawPostData, AppError>> {
  try {
    const client = getApifyClient();
    logger.info({ step: "scrape_post", url }, "Invoking Apify post actor");

    const run = await client.actor(POST_ACTOR_ID).call(
      { post_urls: [url] },
      { waitSecs: 90, timeout: 90 }
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0];

    if (!firstItem) {
      return err(
        new AppError(
          ErrorCodes.SCRAPE_EMPTY,
          404,
          "No data returned for the requested post"
        )
      );
    }

    const parsed = rawPostSchema.safeParse(firstItem);
    const postData = parsed.success ? parsed.data : (firstItem as unknown as RawPostData);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "Post data schema mismatch, using raw fields");
    }
    if (!postData.text && postData.post?.text) {
      postData.text = postData.post.text;
    }

    return ok(postData);
  } catch (error) {
    logger.error({ error, url }, "Failed to scrape post via Apify");
    return err(
      new AppError(
        ErrorCodes.SCRAPE_FAILED,
        502,
        "Failed to scrape LinkedIn post",
        { cause: error }
      )
    );
  }
}

/**
 * Scrapes author profile details (skipped if author is a company page).
 */
export async function scrapeAuthor(
  profileUrl: string
): Promise<Result<RawAuthorData, AppError>> {
  try {
    const client = getApifyClient();
    logger.info({ step: "scrape_author", profileUrl }, "Invoking Apify author actor");

    const run = await client.actor(AUTHOR_ACTOR_ID).call(
      {
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: [profileUrl],
      },
      { waitSecs: 90, timeout: 90 }
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0];

    if (!firstItem) {
      return ok(rawAuthorSchema.parse({}));
    }

    const parsed = rawAuthorSchema.safeParse(firstItem);
    const authorData = parsed.success ? parsed.data : (firstItem as unknown as RawAuthorData);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "Author data schema mismatch, using raw fields");
    }

    if (!authorData.name && (authorData.firstName || authorData.lastName)) {
      authorData.name = `${authorData.firstName ?? ""} ${authorData.lastName ?? ""}`.trim();
    }

    return ok(authorData);
  } catch (error) {
    logger.error({ error, profileUrl }, "Author scrape failed");
    return ok(rawAuthorSchema.parse({}));
  }
}

/**
 * Scrapes company profile details.
 */
export async function scrapeCompany(
  companyUrlOrId: string
): Promise<Result<RawCompanyData, AppError>> {
  try {
    const client = getApifyClient();
    const companyUrl = companyUrlOrId.startsWith("http")
      ? companyUrlOrId
      : `https://www.linkedin.com/company/${companyUrlOrId}`;

    logger.info({ step: "scrape_company", companyUrl }, "Invoking Apify company actor");

    const run = await client.actor(COMPANY_ACTOR_ID).call(
      { companies: [companyUrl] },
      { waitSecs: 90, timeout: 90 }
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0];

    if (!firstItem) {
      return ok(rawCompanySchema.parse({}));
    }

    const parsed = rawCompanySchema.safeParse(firstItem);
    const compData = parsed.success ? parsed.data : (firstItem as unknown as RawCompanyData);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "Company data schema mismatch, using raw fields");
    }

    return ok(compData);
  } catch (error) {
    logger.error({ error, companyUrlOrId }, "Company scrape failed");
    return ok(rawCompanySchema.parse({}));
  }
}
