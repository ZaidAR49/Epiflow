-- ============================================================================
-- FULL SCHEMA: Supabase project mfikrhuzewundqlzwcad (public schema)
-- Schema only, no data. Reflects the live database as of 2026-10-20.
--
-- WHAT THIS SYSTEM IS
--   A Telegram-based access manager: users are approved by an admin, and each
--   user is granted access to specific workflows, with per-workflow quota,
--   expiry, preferences (metadata) and credentials (workflow_credentials).
--
-- TABLE MAP
--   users                  who the person is (Telegram identity, role, status)
--   workflows              the catalog of workflows (slug, active flag, requirements)
--   user_workflow_access   which user may use which workflow (quota, expiry, preferences)
--   workflow_credentials   secrets for one user + one workflow (tokens/API keys),
--                          stored encrypted in Supabase Vault, never in this table
--   job_runs               execution history of the job-xray workflow
--
-- RUN ORDER: extensions -> enums -> tables -> indexes -> functions -> triggers -> grants
--
-- SUPABASE-SPECIFIC: workflow_credentials and its functions use Supabase Vault
-- (schema "vault"). On plain PostgreSQL they will not work unless you replace
-- Vault with another secret store (e.g. pgcrypto column encryption).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Extensions (already enabled on Supabase; listed here for completeness)
-- ----------------------------------------------------------------------------
-- gen_random_uuid() is built in from PostgreSQL 13.
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ----------------------------------------------------------------------------
-- 1. Enum types
-- ----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE public.access_status AS ENUM ('pending', 'approved', 'rejected', 'locked');

-- How a credential authenticates. The encrypted payload shape depends on this:
--   api_key              {"api_key": "..."}
--   oauth_refresh_token  {"refresh_token": "..."}
--   oauth_client         {"client_id": "...", "client_secret": "...", "refresh_token": "..."}
--   basic_auth           {"username": "...", "password": "..."}
-- Add new types later with: ALTER TYPE public.credential_auth_type ADD VALUE '...';
CREATE TYPE public.credential_auth_type AS ENUM
    ('api_key', 'oauth_refresh_token', 'oauth_client', 'basic_auth');

CREATE TYPE public.credential_status AS ENUM
    ('active', 'expired', 'revoked', 'needs_reauth');

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------
-- A user can come from Telegram (telegram_id) or from a third-party sign-in such as
-- Google (email). telegram_id and email are each UNIQUE when present, and the
-- users_identity_check constraint guarantees at least one of them exists.
-- email_verified / image are the standard fields auth libraries and ORMs expect.
CREATE TABLE public.users (
    id                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
    telegram_id        bigint,
    username           text,
    full_name          text                     NOT NULL,
    email              text,
    email_verified     boolean                  NOT NULL DEFAULT false,
    image              text,                    -- profile picture URL
    reason_for_access  text,
    role               public.user_role         NOT NULL DEFAULT 'user'::public.user_role,
    status             public.access_status     NOT NULL DEFAULT 'pending'::public.access_status,
    created_at         timestamp with time zone NOT NULL DEFAULT now(),
    updated_at         timestamp with time zone NOT NULL DEFAULT now(),
    preferred_language text                              DEFAULT 'ar'::text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_telegram_id_key UNIQUE (telegram_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_identity_check CHECK (telegram_id IS NOT NULL OR email IS NOT NULL)
);

CREATE TABLE public.workflows (
    id           uuid                     NOT NULL DEFAULT gen_random_uuid(),
    slug         text                     NOT NULL,
    name         text                     NOT NULL,
    is_active    boolean                  NOT NULL DEFAULT true,
    -- Public URL of the workflow's picture, stored in the "workflow-images" Storage bucket
    -- (see section 6). Only the URL is stored here, never the image itself.
    image_url    text,
    -- Declares what a workflow needs before it can run, e.g.
    --   {"metadata": ["fullName","cv"], "credentials": ["youtube"]}
    requirements jsonb                    NOT NULL DEFAULT '{}'::jsonb,
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    updated_at   timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT workflows_pkey PRIMARY KEY (id),
    CONSTRAINT workflows_slug_key UNIQUE (slug)
);

CREATE TABLE public.user_workflow_access (
    user_id      uuid                     NOT NULL,
    workflow_id  uuid                     NOT NULL,
    usage_count  integer                  NOT NULL DEFAULT 0,
    usage_limit  integer,                          -- NULL = unlimited
    last_used_at timestamp with time zone,
    granted_at   timestamp with time zone NOT NULL DEFAULT now(),
    expires_at   timestamp with time zone,         -- NULL = never expires
    metadata     jsonb                             DEFAULT '{}'::jsonb,  -- non-secret per-workflow preferences
    CONSTRAINT user_workflow_access_pkey PRIMARY KEY (user_id, workflow_id),
    CONSTRAINT user_workflow_access_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT user_workflow_access_workflow_id_fkey
        FOREIGN KEY (workflow_id) REFERENCES public.workflows (id) ON DELETE CASCADE
);

-- Secrets for ONE user in ONE workflow. The secret itself lives encrypted in
-- vault.secrets; this table only holds the reference (secret_id) and non-secret info.
-- Read/write ONLY through set_credential() / get_credential() (service_role only).
CREATE TABLE public.workflow_credentials (
    id                uuid                       NOT NULL DEFAULT gen_random_uuid(),
    user_id           uuid                       NOT NULL,
    workflow_id       uuid                       NOT NULL,
    provider          text                       NOT NULL,  -- 'google', 'youtube', 'openai', ...
    auth_type         public.credential_auth_type NOT NULL,
    secret_id         uuid                       NOT NULL,  -- -> vault.secrets.id (encrypted JSON payload)
    scopes            text[]                     NOT NULL DEFAULT '{}',
    public_info       jsonb                      NOT NULL DEFAULT '{}'::jsonb,  -- non-secret, e.g. {"account_email": "..."}
    status            public.credential_status   NOT NULL DEFAULT 'active',
    expires_at        timestamp with time zone,
    last_refreshed_at timestamp with time zone,
    last_used_at      timestamp with time zone,
    created_at        timestamp with time zone   NOT NULL DEFAULT now(),
    updated_at        timestamp with time zone   NOT NULL DEFAULT now(),
    CONSTRAINT workflow_credentials_pkey PRIMARY KEY (id),
    CONSTRAINT workflow_credentials_secret_id_key UNIQUE (secret_id),
    CONSTRAINT workflow_credentials_unique UNIQUE (user_id, workflow_id, provider),
    -- A credential cannot exist without access; revoking access deletes it.
    CONSTRAINT workflow_credentials_access_fkey
        FOREIGN KEY (user_id, workflow_id)
        REFERENCES public.user_workflow_access (user_id, workflow_id) ON DELETE CASCADE
);

CREATE TABLE public.job_runs (
    id                uuid                     NOT NULL DEFAULT gen_random_uuid(),
    user_id           uuid                     NOT NULL,
    channel           text                     NOT NULL DEFAULT 'web'::text,
    url               text                     NOT NULL,
    normalized_url    text                     NOT NULL,
    status            text                     NOT NULL DEFAULT 'pending'::text,
    post_data         jsonb,
    author_data       jsonb,
    company_data      jsonb,
    report            jsonb,
    telegram_report   text,
    error_code        text,
    error_message     text,
    usage_consumed_at timestamp with time zone,
    created_at        timestamp with time zone NOT NULL DEFAULT now(),
    updated_at        timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT job_runs_pkey PRIMARY KEY (id),
    CONSTRAINT job_runs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. Indexes (primary key / unique indexes are created by the constraints above)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_status
    ON public.users USING btree (status);

CREATE INDEX idx_users_username
    ON public.users USING btree (username)
    WHERE (username IS NOT NULL);

CREATE INDEX idx_workflows_is_active
    ON public.workflows USING btree (is_active);

CREATE INDEX idx_user_workflow_access_workflow_id
    ON public.user_workflow_access USING btree (workflow_id);

CREATE INDEX idx_workflow_credentials_workflow_id
    ON public.workflow_credentials USING btree (workflow_id);

CREATE INDEX idx_job_runs_user_id        ON public.job_runs USING btree (user_id);
CREATE INDEX idx_job_runs_status         ON public.job_runs USING btree (status);
CREATE INDEX idx_job_runs_normalized_url ON public.job_runs USING btree (normalized_url);
CREATE INDEX idx_job_runs_created_at     ON public.job_runs USING btree (created_at);

-- ----------------------------------------------------------------------------
-- 4. Functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Gatekeeper: decides whether a Telegram user may run a workflow.
-- Read-only except for syncing the Telegram username. Does NOT consume quota.
CREATE OR REPLACE FUNCTION public.authenticate_gatekeeper(
    p_telegram_id bigint,
    p_workflow_slug text,
    p_username text DEFAULT NULL::text
)
 RETURNS TABLE(
    is_authorized   boolean,
    status_code     integer,
    error_code      text,
    user_id         uuid,
    workflow_id     uuid,
    first_name      text,
    user_role       public.user_role,
    remaining_quota integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user RECORD;
    v_workflow RECORD;
    v_access RECORD;
    v_first_name TEXT;
BEGIN
    -- 1. Authenticate User (401 if not found)
    SELECT u.id, u.full_name, u.status, u.role, u.username INTO v_user
    FROM public.users u
    WHERE u.telegram_id = p_telegram_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 401, 'UNREGISTERED'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::public.user_role, NULL::INT4;
        RETURN;
    END IF;

    -- Keep Telegram username in sync if it changed (idempotent)
    IF p_username IS NOT NULL AND p_username IS DISTINCT FROM v_user.username THEN
        UPDATE public.users SET username = p_username WHERE id = v_user.id;
    END IF;

    v_first_name := split_part(v_user.full_name, ' ', 1);

    -- 2. Global account status (423 Locked, 403 Pending/Rejected)
    IF v_user.status = 'locked' THEN
        RETURN QUERY SELECT false, 423, 'ACCOUNT_LOCKED'::TEXT, v_user.id, NULL::UUID, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    IF v_user.status = 'pending' THEN
        RETURN QUERY SELECT false, 403, 'ACCOUNT_PENDING'::TEXT, v_user.id, NULL::UUID, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    IF v_user.status = 'rejected' THEN
        RETURN QUERY SELECT false, 403, 'ACCOUNT_REJECTED'::TEXT, v_user.id, NULL::UUID, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    -- 3. Workflow resource (403 if not found, 503 if disabled)
    SELECT w.id, w.is_active INTO v_workflow
    FROM public.workflows w
    WHERE w.slug = p_workflow_slug;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 403, 'WORKFLOW_FORBIDDEN'::TEXT, v_user.id, NULL::UUID, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    IF NOT v_workflow.is_active THEN
        RETURN QUERY SELECT false, 503, 'WORKFLOW_DISABLED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    -- 4. Workflow permission, expiration and quota (read-only)
    SELECT uwa.usage_count, uwa.usage_limit, uwa.expires_at INTO v_access
    FROM public.user_workflow_access uwa
    WHERE uwa.user_id = v_user.id AND uwa.workflow_id = v_workflow.id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 403, 'WORKFLOW_FORBIDDEN'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    IF v_access.expires_at IS NOT NULL AND v_access.expires_at < now() THEN
        RETURN QUERY SELECT false, 403, 'ACCESS_EXPIRED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, 0::INT4;
        RETURN;
    END IF;

    IF v_access.usage_limit IS NOT NULL AND v_access.usage_count >= v_access.usage_limit THEN
        RETURN QUERY SELECT false, 429, 'QUOTA_EXCEEDED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, 0::INT4;
        RETURN;
    END IF;

    -- 5. Authorized (200 OK). Usage is NOT consumed here; call consume_workflow_usage after success.
    RETURN QUERY SELECT
        true,
        200,
        'AUTHORIZED'::TEXT,
        v_user.id,
        v_workflow.id,
        v_first_name,
        v_user.role,
        CASE WHEN v_access.usage_limit IS NULL THEN NULL ELSE (v_access.usage_limit - v_access.usage_count) END;
END;
$function$;

-- Atomic, guarded usage increment. Call once, after a workflow succeeds.
-- Returns consumed = false (and NULL quota) if the grant is missing, expired or at its limit.
CREATE OR REPLACE FUNCTION public.consume_workflow_usage(
    p_user_id uuid,
    p_workflow_slug text
)
 RETURNS TABLE(consumed boolean, remaining_quota integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_limit integer;
    v_count integer;
BEGIN
    UPDATE public.user_workflow_access uwa
    SET usage_count = uwa.usage_count + 1,
        last_used_at = now()
    FROM public.workflows w
    WHERE w.id = uwa.workflow_id
      AND w.slug = p_workflow_slug
      AND uwa.user_id = p_user_id
      AND (uwa.expires_at IS NULL OR uwa.expires_at > now())
      AND (uwa.usage_limit IS NULL OR uwa.usage_count < uwa.usage_limit)
    RETURNING uwa.usage_limit, uwa.usage_count INTO v_limit, v_count;

    IF FOUND THEN
        RETURN QUERY SELECT true, CASE WHEN v_limit IS NULL THEN NULL ELSE (v_limit - v_count) END;
    ELSE
        RETURN QUERY SELECT false, NULL::integer;
    END IF;
END;
$function$;

-- Creates or updates (upserts) a credential and its encrypted Vault secret.
-- Calling it again for the same (user, workflow, provider) REPLACES the secret,
-- which is how a rotated refresh token should be saved.
-- p_payload shape depends on p_auth_type (see the credential_auth_type enum above).
-- Payload validation is the caller's job; the database stores whatever JSON it gets.
CREATE OR REPLACE FUNCTION public.set_credential(
    p_user_id     uuid,
    p_workflow_id uuid,
    p_provider    text,
    p_auth_type   public.credential_auth_type,
    p_payload     jsonb,
    p_scopes      text[]      DEFAULT '{}',
    p_public_info jsonb       DEFAULT '{}',
    p_expires_at  timestamptz DEFAULT NULL
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_secret uuid; v_id uuid;
begin
  select id, secret_id into v_id, v_secret from public.workflow_credentials
   where user_id = p_user_id and workflow_id = p_workflow_id and provider = p_provider;

  if v_id is null then
    v_secret := vault.create_secret(p_payload::text,
                  p_user_id::text || ':' || p_workflow_id::text || ':' || p_provider);
    insert into public.workflow_credentials
      (user_id, workflow_id, provider, auth_type, secret_id, scopes, public_info, expires_at)
    values (p_user_id, p_workflow_id, p_provider, p_auth_type, v_secret,
            p_scopes, p_public_info, p_expires_at)
    returning id into v_id;
  else
    perform vault.update_secret(v_secret, p_payload::text);
    update public.workflow_credentials
       set auth_type = p_auth_type, scopes = p_scopes, public_info = p_public_info,
           expires_at = p_expires_at, status = 'active',
           last_refreshed_at = now(), updated_at = now()
     where id = v_id;
  end if;
  return v_id;
end $function$;

-- Returns {auth_type, scopes, expires_at, payload} with the DECRYPTED secret,
-- or NULL if there is no active credential. Also stamps last_used_at.
CREATE OR REPLACE FUNCTION public.get_credential(
    p_user_id     uuid,
    p_workflow_id uuid,
    p_provider    text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r record;
begin
  select c.id, c.auth_type, c.scopes, c.expires_at, s.decrypted_secret
    into r
    from public.workflow_credentials c
    join vault.decrypted_secrets s on s.id = c.secret_id
   where c.user_id = p_user_id and c.workflow_id = p_workflow_id
     and c.provider = p_provider and c.status = 'active';
  if not found then return null; end if;

  update public.workflow_credentials set last_used_at = now()
   where id = r.id;

  return jsonb_build_object(
    'auth_type', r.auth_type, 'scopes', r.scopes,
    'expires_at', r.expires_at, 'payload', r.decrypted_secret::jsonb);
end $function$;

-- Trigger function: when a credential row is deleted (directly, or by cascade
-- when workflow access is revoked), delete its encrypted secret from Vault too.
CREATE OR REPLACE FUNCTION public.delete_credential_secret()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end $function$;

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_delete_credential_secret
    AFTER DELETE ON public.workflow_credentials
    FOR EACH ROW EXECUTE FUNCTION public.delete_credential_secret();

COMMIT;

-- ----------------------------------------------------------------------------
-- 6. Permissions (Supabase roles). Run after COMMIT.
--    The secret-handling and gatekeeper functions are callable ONLY by the
--    backend (service_role), never by anon / authenticated client keys.
-- ----------------------------------------------------------------------------
-- workflow_credentials: no client access at all (RLS on, no policies).
ALTER TABLE public.workflow_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workflow_credentials FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_workflow_usage(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_credential(uuid, uuid, text, public.credential_auth_type, jsonb, text[], jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_credential(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_credential_secret() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_workflow_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_credential(uuid, uuid, text, public.credential_auth_type, jsonb, text[], jsonb, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credential(uuid, uuid, text) TO service_role;

-- Storage bucket for workflow images (Supabase Storage).
-- Public bucket: anyone can VIEW a file by its URL. Uploading/changing files requires
-- the service role (no storage policies are created, so anon/authenticated cannot write).
-- URL format: https://<project-ref>.supabase.co/storage/v1/object/public/workflow-images/<file>
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('workflow-images', 'workflow-images', true, 2097152,
        ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. KNOWN GAPS (NOT applied on the live database; review before enabling)
-- ----------------------------------------------------------------------------
-- (a) Row Level Security is DISABLED on users, workflows, user_workflow_access
--     and job_runs. Anyone with the anon key can read and modify them.
--     Enabling RLS with no policies blocks everything except the service role,
--     so only run this once you confirm your backend uses the service role:
--
-- ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workflows            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_workflow_access ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.job_runs             ENABLE ROW LEVEL SECURITY;
--
-- (b) job_runs.updated_at is never updated automatically (no trigger).
--
-- CREATE TRIGGER set_job_runs_updated_at
--     BEFORE UPDATE ON public.job_runs
--     FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
--
-- (c) handle_updated_at has a mutable search_path (linter warning):
--
-- ALTER FUNCTION public.handle_updated_at() SET search_path = '';