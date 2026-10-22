-- =====================================================================
-- EpiFlow — full database schema (public schema + storage bucket)
-- Generated from the live database on 2026-10-22.
-- Reflects the CURRENT live state. The usage/billing migration
-- (migration_usage_and_billing.sql) has NOT been applied yet.
--
-- Order: extensions, enums, tables, constraints, indexes, functions,
--        triggers, RLS, function grants, storage.
-- Not included: table-level GRANTs to anon/authenticated, and data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS (normally pre-enabled on Supabase)
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists supabase_vault;

-- ---------------------------------------------------------------------
-- 2. ENUM TYPES
-- ---------------------------------------------------------------------
CREATE TYPE public.access_grant_source   AS ENUM ('admin', 'payment', 'promo');
CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.access_status         AS ENUM ('pending', 'approved', 'rejected', 'locked');
CREATE TYPE public.credential_auth_type  AS ENUM ('api_key', 'oauth_refresh_token', 'oauth_client', 'basic_auth');
CREATE TYPE public.credential_status     AS ENUM ('active', 'expired', 'revoked', 'needs_reauth');
CREATE TYPE public.run_status            AS ENUM ('pending', 'validating', 'scraping_post', 'scraping_author', 'scraping_company', 'generating_report', 'completed', 'failed');
CREATE TYPE public.user_role             AS ENUM ('admin', 'user', 'guest');

-- ---------------------------------------------------------------------
-- 3. TABLES
-- ---------------------------------------------------------------------
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  telegram_id bigint,
  username text,
  full_name text NOT NULL,
  reason_for_access text,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  status access_status NOT NULL DEFAULT 'pending'::access_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  preferred_language text DEFAULT 'ar'::text,
  email text,
  email_verified boolean NOT NULL DEFAULT false,
  image text
);

CREATE TABLE public.user_identities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  handle text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text
);

CREATE TABLE public.workflow_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  channel text NOT NULL,
  handle text NOT NULL,
  url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_workflow_access (
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  usage_limit integer,
  last_used_at timestamp with time zone,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  granted_via access_grant_source NOT NULL DEFAULT 'admin'::access_grant_source
);

CREATE TABLE public.workflow_access_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  reason text NOT NULL,
  status access_request_status NOT NULL DEFAULT 'pending'::access_request_status,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.workflow_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  provider text NOT NULL,
  auth_type credential_auth_type NOT NULL,
  secret_id uuid NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}'::text[],
  public_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  status credential_status NOT NULL DEFAULT 'active'::credential_status,
  expires_at timestamp with time zone,
  last_refreshed_at timestamp with time zone,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.job_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'web'::text,
  url text NOT NULL,
  normalized_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  post_data jsonb,
  author_data jsonb,
  company_data jsonb,
  report jsonb,
  telegram_report text,
  error_code text,
  error_message text,
  usage_consumed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 4. CONSTRAINTS (primary keys, unique, checks, then foreign keys)
-- ---------------------------------------------------------------------
ALTER TABLE public.job_runs                 ADD CONSTRAINT job_runs_pkey                 PRIMARY KEY (id);
ALTER TABLE public.user_identities          ADD CONSTRAINT user_identities_pkey          PRIMARY KEY (id);
ALTER TABLE public.user_workflow_access     ADD CONSTRAINT user_workflow_access_pkey     PRIMARY KEY (user_id, workflow_id);
ALTER TABLE public.users                    ADD CONSTRAINT users_pkey                    PRIMARY KEY (id);
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.workflow_channels        ADD CONSTRAINT workflow_channels_pkey        PRIMARY KEY (id);
ALTER TABLE public.workflow_credentials     ADD CONSTRAINT workflow_credentials_pkey     PRIMARY KEY (id);
ALTER TABLE public.workflows                ADD CONSTRAINT workflows_pkey                PRIMARY KEY (id);

ALTER TABLE public.user_identities      ADD CONSTRAINT uq_identity_provider_account      UNIQUE (provider, provider_user_id);
ALTER TABLE public.user_identities      ADD CONSTRAINT uq_identity_user_provider         UNIQUE (user_id, provider);
ALTER TABLE public.users                ADD CONSTRAINT users_email_key                   UNIQUE (email);
ALTER TABLE public.users                ADD CONSTRAINT users_telegram_id_key             UNIQUE (telegram_id);
ALTER TABLE public.workflow_channels    ADD CONSTRAINT uq_workflow_channel               UNIQUE (workflow_id, channel);
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_secret_id_key UNIQUE (secret_id);
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_unique       UNIQUE (user_id, workflow_id, provider);
ALTER TABLE public.workflows            ADD CONSTRAINT workflows_slug_key                UNIQUE (slug);

ALTER TABLE public.users                    ADD CONSTRAINT users_identity_check                  CHECK (((telegram_id IS NOT NULL) OR (email IS NOT NULL)));
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_reason_check CHECK ((length(btrim(reason)) > 0));
ALTER TABLE public.workflow_channels        ADD CONSTRAINT workflow_channels_handle_check        CHECK ((length(btrim(handle)) > 0));

ALTER TABLE public.job_runs                 ADD CONSTRAINT job_runs_user_id_fkey                      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.user_identities          ADD CONSTRAINT user_identities_user_id_fkey               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.user_workflow_access     ADD CONSTRAINT user_workflow_access_user_id_fkey          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.user_workflow_access     ADD CONSTRAINT user_workflow_access_workflow_id_fkey      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_reviewed_by_fkey  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_user_id_fkey      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_workflow_id_fkey  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_channels        ADD CONSTRAINT workflow_channels_workflow_id_fkey         FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_credentials     ADD CONSTRAINT workflow_credentials_access_fkey           FOREIGN KEY (user_id, workflow_id) REFERENCES user_workflow_access(user_id, workflow_id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 5. INDEXES (those not already created by a constraint above)
-- ---------------------------------------------------------------------
CREATE INDEX idx_access_requests_status ON public.workflow_access_requests USING btree (status);
CREATE INDEX idx_access_requests_user_id ON public.workflow_access_requests USING btree (user_id);
CREATE INDEX idx_access_requests_workflow_id ON public.workflow_access_requests USING btree (workflow_id);
CREATE INDEX idx_job_runs_created_at ON public.job_runs USING btree (created_at);
CREATE INDEX idx_job_runs_normalized_url ON public.job_runs USING btree (normalized_url);
CREATE INDEX idx_job_runs_status ON public.job_runs USING btree (status);
CREATE INDEX idx_job_runs_user_id ON public.job_runs USING btree (user_id);
CREATE INDEX idx_user_workflow_access_workflow_id ON public.user_workflow_access USING btree (workflow_id);
CREATE INDEX idx_users_status ON public.users USING btree (status);
CREATE INDEX idx_users_username ON public.users USING btree (username) WHERE (username IS NOT NULL);
CREATE INDEX idx_workflow_credentials_workflow_id ON public.workflow_credentials USING btree (workflow_id);
CREATE INDEX idx_workflows_is_active ON public.workflows USING btree (is_active);
CREATE UNIQUE INDEX uq_access_requests_one_pending ON public.workflow_access_requests USING btree (user_id, workflow_id) WHERE (status = 'pending'::access_request_status);

-- ---------------------------------------------------------------------
-- 6. FUNCTIONS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.authenticate_gatekeeper(p_telegram_id bigint, p_workflow_slug text, p_username text DEFAULT NULL::text)
 RETURNS TABLE(is_authorized boolean, status_code integer, error_code text, user_id uuid, workflow_id uuid, first_name text, user_role user_role, remaining_quota integer)
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
    -- 1. Authenticate User through the Telegram identity (401 if not found)
    SELECT u.id, u.full_name, u.status, u.role, i.handle AS username INTO v_user
    FROM public.user_identities i
    JOIN public.users u ON u.id = i.user_id
    WHERE i.provider = 'telegram' AND i.provider_user_id = p_telegram_id::text;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 401, 'UNREGISTERED'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::public.user_role, NULL::INT4;
        RETURN;
    END IF;

    -- Keep Telegram username in sync if it changed (identity is the source of truth;
    -- legacy users.username is kept in step so older readers don't go stale)
    IF p_username IS NOT NULL AND p_username IS DISTINCT FROM v_user.username THEN
        UPDATE public.user_identities ui
           SET handle = p_username
         WHERE ui.user_id = v_user.id AND ui.provider = 'telegram';
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

CREATE OR REPLACE FUNCTION public.consume_workflow_usage(p_user_id uuid, p_workflow_slug text)
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

CREATE OR REPLACE FUNCTION public.register_telegram_user(p_telegram_id bigint, p_full_name text, p_username text DEFAULT NULL::text, p_preferred_language text DEFAULT 'ar'::text)
 RETURNS TABLE(out_user_id uuid, is_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user uuid;
BEGIN
    SELECT i.user_id INTO v_user
    FROM public.user_identities i
    WHERE i.provider = 'telegram' AND i.provider_user_id = p_telegram_id::text;

    IF FOUND THEN
        RETURN QUERY SELECT v_user, false;
        RETURN;
    END IF;

    BEGIN
        INSERT INTO public.users (telegram_id, username, full_name, preferred_language)
        VALUES (p_telegram_id, p_username, p_full_name, p_preferred_language)
        RETURNING id INTO v_user;

        INSERT INTO public.user_identities (user_id, provider, provider_user_id, handle)
        VALUES (v_user, 'telegram', p_telegram_id::text, p_username);
    EXCEPTION WHEN unique_violation THEN
        -- Lost a race with a concurrent registration: return the winner.
        SELECT i.user_id INTO v_user
        FROM public.user_identities i
        WHERE i.provider = 'telegram' AND i.provider_user_id = p_telegram_id::text;
        IF NOT FOUND THEN
            RAISE;
        END IF;
        RETURN QUERY SELECT v_user, false;
        RETURN;
    END;

    RETURN QUERY SELECT v_user, true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_credential(p_user_id uuid, p_workflow_id uuid, p_provider text, p_auth_type credential_auth_type, p_payload jsonb, p_scopes text[] DEFAULT '{}'::text[], p_public_info jsonb DEFAULT '{}'::jsonb, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
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

CREATE OR REPLACE FUNCTION public.get_credential(p_user_id uuid, p_workflow_id uuid, p_provider text)
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

-- ---------------------------------------------------------------------
-- 7. TRIGGERS
-- ---------------------------------------------------------------------
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_access_requests_updated_at
  BEFORE UPDATE ON public.workflow_access_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_delete_credential_secret
  AFTER DELETE ON public.workflow_credentials
  FOR EACH ROW EXECUTE FUNCTION delete_credential_secret();

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
--    Enabled (no policies = service_role only) on these four tables.
--    NOT enabled on: users, workflows, user_workflow_access, job_runs
--    (live state; Supabase flags these as exposed to the anon key).
-- ---------------------------------------------------------------------
ALTER TABLE public.user_identities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_channels        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_credentials     ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 9. FUNCTION PRIVILEGES (service_role only, except handle_updated_at)
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.consume_workflow_usage(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_workflow_usage(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.register_telegram_user(bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_telegram_user(bigint, text, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.set_credential(uuid, uuid, text, credential_auth_type, jsonb, text[], jsonb, timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_credential(uuid, uuid, text, credential_auth_type, jsonb, text[], jsonb, timestamp with time zone) TO service_role;

REVOKE ALL ON FUNCTION public.get_credential(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credential(uuid, uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.delete_credential_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_credential_secret() TO service_role;

-- ---------------------------------------------------------------------
-- 10. STORAGE
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('workflow-images', 'workflow-images', true, 10485760, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;