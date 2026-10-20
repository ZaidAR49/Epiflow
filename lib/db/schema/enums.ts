import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "user", "guest"]);
export const accessStatusEnum = pgEnum("access_status", [
  "pending",
  "approved",
  "rejected",
  "locked",
]);
export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "validating",
  "scraping_post",
  "scraping_author",
  "scraping_company",
  "generating_report",
  "completed",
  "failed",
]);
export const credentialAuthTypeEnum = pgEnum("credential_auth_type", [
  "api_key",
  "oauth_refresh_token",
  "oauth_client",
  "basic_auth",
]);
export const credentialStatusEnum = pgEnum("credential_status", [
  "active",
  "expired",
  "revoked",
  "needs_reauth",
]);
