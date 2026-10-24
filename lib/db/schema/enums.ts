import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "editor",
  "viewer",
  "user",
  "guest",
]);

export const accessStatusEnum = pgEnum("access_status", [
  "pending",
  "approved",
  "rejected",
  "locked",
]);

export const runStatusEnum = pgEnum("run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "canceled",
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

export const accessGrantSourceEnum = pgEnum("access_grant_source", [
  "admin",
  "payment",
  "promo",
]);

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "pending",
  "approved",
  "rejected",
]);
