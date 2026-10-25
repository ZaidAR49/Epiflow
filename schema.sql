-- =====================================================================
-- Z-flow — full database schema (public schema + storage bucket)
-- Generated 2026-10-24.
--
-- STATUS: this is the TARGET schema =
--     your live database
--   + migration_usage_and_billing.sql   (usage meters, plans, subscriptions, payments)
--   + migration_hardening.sql           (security + performance)
--   + migration_simplify_and_align.sql  (roles, generic job_runs, index audit, aligned functions)
-- None of the three migrations has been applied to the live Supabase project yet, so the
-- live database does not contain what is below that those files add.
--
-- A plan grants SPECIFIC workflows only (plans.entitlements); a subscription
-- never gives access to everything.
--
-- SECURITY MODEL: every table has RLS enabled and NO policies, and the browser
-- roles (anon, authenticated) hold no privileges on any table or function.
-- Only the backend (service_role key, or a direct Postgres connection) can read
-- or write. If you later build a browser client that talks to Supabase directly,
-- add narrow policies + GRANTs for exactly the tables it needs.
--
-- Order: extensions, default privileges, enums, tables, constraints, indexes,
--        functions, triggers, RLS, privileges, seed data, storage.
-- Not included: user data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS (normally pre-enabled on Supabase)
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists supabase_vault;

-- ---------------------------------------------------------------------
-- 2. DEFAULT PRIVILEGES
--    Supabase hands anon/authenticated every new table and function by default.
--    Turn that off, so a table or function added later is never exposed by accident.
-- ---------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. ENUM TYPES
-- ---------------------------------------------------------------------
CREATE TYPE public.access_grant_source   AS ENUM ('admin', 'payment', 'promo');
CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.access_status         AS ENUM ('pending', 'approved', 'rejected', 'locked');
CREATE TYPE public.credential_auth_type  AS ENUM ('api_key', 'oauth_refresh_token', 'oauth_client', 'basic_auth');
CREATE TYPE public.credential_status     AS ENUM ('active', 'expired', 'revoked', 'needs_reauth');
CREATE TYPE public.run_status            AS ENUM ('pending', 'running', 'completed', 'failed', 'canceled');
CREATE TYPE public.user_role             AS ENUM ('admin', 'editor', 'viewer', 'user', 'guest');

-- ---------------------------------------------------------------------
-- 4. TABLES
-- ---------------------------------------------------------------------
-- users: people who can use the platform (Telegram and/or email)
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  reason_for_access text,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  status access_status NOT NULL DEFAULT 'pending'::access_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  preferred_language text DEFAULT 'ar'::text,
  email text,
  email_verified boolean NOT NULL DEFAULT false
);

-- user_identities: login identities per user (telegram, ...)
CREATE TABLE public.user_identities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  handle text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- workflows: the workflows you offer
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

-- workflow_channels: where each workflow is reachable (telegram bot, web, ...)
CREATE TABLE public.workflow_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  channel text NOT NULL,
  handle text NOT NULL,
  url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- user_workflow_access: which user may use which workflow (one row per pair)
CREATE TABLE public.user_workflow_access (
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  last_used_at timestamp with time zone,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  granted_via access_grant_source NOT NULL DEFAULT 'admin'::access_grant_source,
  subscription_id uuid
);
ALTER TABLE public.user_workflow_access SET (fillfactor = 85);   -- updated on every consumed run: leave room for in-page (HOT) updates

-- workflow_access_requests: users asking for access to a workflow
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

-- workflow_credentials: per-user provider credentials (secret lives in vault)
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

-- job_runs: one row per workflow run; 'usage' holds what that run consumed
CREATE TABLE public.job_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'web'::text,
  status run_status NOT NULL DEFAULT 'pending'::run_status,
  error_code text,
  error_message text,
  usage_consumed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  usage jsonb,
  workflow_id uuid NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb
);

-- usage_meters: catalog of countable things: runs, ai_tokens, ...
CREATE TABLE public.usage_meters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- access_usage: used + limit per user, workflow and meter (replaces usage_count/usage_limit)
CREATE TABLE public.access_usage (
  user_id uuid NOT NULL,
  workflow_id uuid NOT NULL,
  meter_id uuid NOT NULL,
  used bigint NOT NULL DEFAULT 0,
  limit_value bigint,
  period text NOT NULL DEFAULT 'lifetime'::text,
  period_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.access_usage SET (fillfactor = 85);   -- updated on every consumed run: leave room for in-page (HOT) updates

-- plans: what you sell; 'entitlements' lists the SPECIFIC workflows and limits a plan grants
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  price_minor integer NOT NULL,
  currency character(3) NOT NULL DEFAULT 'USD'::bpchar,
  billing_interval text NOT NULL,
  trial_days integer NOT NULL DEFAULT 0,
  provider text,
  provider_price_id text,
  entitlements jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- subscriptions: a user's subscription to a plan (state mirrored from the payment provider)
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamp with time zone,
  provider text NOT NULL,
  provider_subscription_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- payments: money ledger: one row per provider payment; rows are never deleted or re-priced
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid,
  subscription_id uuid,
  provider text NOT NULL,
  provider_payment_id text NOT NULL,
  amount_minor integer NOT NULL,
  currency character(3) NOT NULL,
  status text NOT NULL,
  refunded_minor integer NOT NULL DEFAULT 0,
  failure_code text,
  failure_message text,
  receipt_url text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 5. CONSTRAINTS (primary keys, unique, checks, then foreign keys)
-- ---------------------------------------------------------------------
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.user_identities ADD CONSTRAINT user_identities_pkey PRIMARY KEY (id);
ALTER TABLE public.workflows ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);
ALTER TABLE public.workflow_channels ADD CONSTRAINT workflow_channels_pkey PRIMARY KEY (id);
ALTER TABLE public.user_workflow_access ADD CONSTRAINT user_workflow_access_pkey PRIMARY KEY (user_id, workflow_id);
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_pkey PRIMARY KEY (id);
ALTER TABLE public.job_runs ADD CONSTRAINT job_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.usage_meters ADD CONSTRAINT usage_meters_pkey PRIMARY KEY (id);
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_pkey PRIMARY KEY (user_id, workflow_id, meter_id);
ALTER TABLE public.plans ADD CONSTRAINT plans_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.user_identities ADD CONSTRAINT uq_identity_provider_account UNIQUE (provider, provider_user_id);
ALTER TABLE public.user_identities ADD CONSTRAINT uq_identity_user_provider UNIQUE (user_id, provider);
ALTER TABLE public.workflows ADD CONSTRAINT workflows_slug_key UNIQUE (slug);
ALTER TABLE public.workflow_channels ADD CONSTRAINT uq_workflow_channel UNIQUE (workflow_id, channel);
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_secret_id_key UNIQUE (secret_id);
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_unique UNIQUE (user_id, workflow_id, provider);
ALTER TABLE public.usage_meters ADD CONSTRAINT usage_meters_key_key UNIQUE (key);
ALTER TABLE public.plans ADD CONSTRAINT plans_code_key UNIQUE (code);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_provider_provider_subscription_id_key UNIQUE (provider, provider_subscription_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_provider_provider_payment_id_key UNIQUE (provider, provider_payment_id);

ALTER TABLE public.workflow_channels ADD CONSTRAINT workflow_channels_handle_check CHECK ((length(btrim(handle)) > 0));
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_reason_check CHECK ((length(btrim(reason)) > 0));
ALTER TABLE public.job_runs ADD CONSTRAINT job_runs_input_check CHECK ((jsonb_typeof(input) = 'object'::text));
ALTER TABLE public.usage_meters ADD CONSTRAINT usage_meters_key_check CHECK ((key ~ '^[a-z][a-z0-9_:-]*$'::text));
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_limit_value_check CHECK (((limit_value IS NULL) OR (limit_value >= 0)));
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_period_check CHECK ((period = ANY (ARRAY['lifetime'::text, 'monthly'::text])));
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_used_check CHECK ((used >= 0));
ALTER TABLE public.plans ADD CONSTRAINT plans_billing_interval_check CHECK ((billing_interval = ANY (ARRAY['month'::text, 'year'::text, 'one_time'::text])));
ALTER TABLE public.plans ADD CONSTRAINT plans_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text));
ALTER TABLE public.plans ADD CONSTRAINT plans_entitlements_check CHECK ((jsonb_typeof(entitlements) = 'object'::text));
ALTER TABLE public.plans ADD CONSTRAINT plans_price_minor_check CHECK ((price_minor >= 0));
ALTER TABLE public.plans ADD CONSTRAINT plans_provider_price_check CHECK (((provider_price_id IS NULL) OR (provider IS NOT NULL)));
ALTER TABLE public.plans ADD CONSTRAINT plans_trial_days_check CHECK ((trial_days >= 0));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_period_check CHECK (((current_period_end IS NULL) OR (current_period_start IS NULL) OR (current_period_end >= current_period_start)));
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'canceled'::text, 'expired'::text, 'paused'::text])));
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_minor_check CHECK ((amount_minor >= 0));
ALTER TABLE public.payments ADD CONSTRAINT payments_check CHECK (((refunded_minor >= 0) AND (refunded_minor <= amount_minor)));
ALTER TABLE public.payments ADD CONSTRAINT payments_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text));
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text, 'partially_refunded'::text, 'disputed'::text])));

ALTER TABLE public.user_identities ADD CONSTRAINT user_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_channels ADD CONSTRAINT workflow_channels_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.user_workflow_access ADD CONSTRAINT user_workflow_access_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.user_workflow_access ADD CONSTRAINT user_workflow_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.user_workflow_access ADD CONSTRAINT user_workflow_access_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_access_requests ADD CONSTRAINT workflow_access_requests_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_credentials ADD CONSTRAINT workflow_credentials_access_fkey FOREIGN KEY (user_id, workflow_id) REFERENCES user_workflow_access(user_id, workflow_id) ON DELETE CASCADE;
ALTER TABLE public.job_runs ADD CONSTRAINT job_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE public.job_runs ADD CONSTRAINT job_runs_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE RESTRICT;
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_meter_id_fkey FOREIGN KEY (meter_id) REFERENCES usage_meters(id);
ALTER TABLE public.access_usage ADD CONSTRAINT access_usage_user_id_workflow_id_fkey FOREIGN KEY (user_id, workflow_id) REFERENCES user_workflow_access(user_id, workflow_id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- ---------------------------------------------------------------------
-- 6. INDEXES (those not already created by a constraint above)
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_pending ON public.users USING btree (created_at) WHERE (status = 'pending'::access_status);
CREATE INDEX idx_user_workflow_access_expires_at ON public.user_workflow_access USING btree (expires_at) WHERE (expires_at IS NOT NULL);
CREATE INDEX idx_user_workflow_access_subscription_id ON public.user_workflow_access USING btree (subscription_id) WHERE (subscription_id IS NOT NULL);
CREATE INDEX idx_user_workflow_access_workflow_id ON public.user_workflow_access USING btree (workflow_id);
CREATE INDEX idx_access_requests_pending ON public.workflow_access_requests USING btree (created_at) WHERE (status = 'pending'::access_request_status);
CREATE INDEX idx_access_requests_reviewed_by ON public.workflow_access_requests USING btree (reviewed_by) WHERE (reviewed_by IS NOT NULL);
CREATE INDEX idx_access_requests_user_id ON public.workflow_access_requests USING btree (user_id);
CREATE INDEX idx_access_requests_workflow_id ON public.workflow_access_requests USING btree (workflow_id);
CREATE UNIQUE INDEX uq_access_requests_one_pending ON public.workflow_access_requests USING btree (user_id, workflow_id) WHERE (status = 'pending'::access_request_status);
CREATE INDEX idx_job_runs_active ON public.job_runs USING btree (created_at) WHERE (status = ANY (ARRAY['pending'::run_status, 'running'::run_status]));
CREATE INDEX idx_job_runs_created_at ON public.job_runs USING btree (created_at);
CREATE INDEX idx_job_runs_user_created ON public.job_runs USING btree (user_id, created_at DESC);
CREATE INDEX idx_job_runs_workflow_created ON public.job_runs USING btree (workflow_id, created_at DESC);
CREATE INDEX idx_access_usage_meter_id ON public.access_usage USING btree (meter_id);
CREATE UNIQUE INDEX uq_plans_provider_price ON public.plans USING btree (provider, provider_price_id) WHERE (provider_price_id IS NOT NULL);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end) WHERE (status = ANY (ARRAY['active'::text, 'trialing'::text, 'past_due'::text]));
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions USING btree (plan_id);
CREATE INDEX idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);
CREATE INDEX idx_payments_plan_id ON public.payments USING btree (plan_id) WHERE (plan_id IS NOT NULL);
CREATE INDEX idx_payments_subscription_id ON public.payments USING btree (subscription_id) WHERE (subscription_id IS NOT NULL);
CREATE INDEX idx_payments_user_created ON public.payments USING btree (user_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 7. FUNCTIONS
-- ---------------------------------------------------------------------
-- handle_updated_at: generic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- validate_plan_entitlements: trigger: rejects plans that reference unknown workflows/meters or bad limits
CREATE OR REPLACE FUNCTION public.validate_plan_entitlements()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_slug text;
    v_meters jsonb;
    v_meter text;
    v_limit jsonb;
BEGIN
    FOR v_slug, v_meters IN SELECT e.key, e.value FROM jsonb_each(NEW.entitlements) e LOOP
        IF NOT EXISTS (SELECT 1 FROM public.workflows w WHERE w.slug = v_slug) THEN
            RAISE EXCEPTION 'plan entitlements: unknown workflow slug "%"', v_slug;
        END IF;
        IF jsonb_typeof(v_meters) <> 'object' THEN
            RAISE EXCEPTION 'plan entitlements: "%" must map meter keys to limits', v_slug;
        END IF;
        FOR v_meter, v_limit IN SELECT e.key, e.value FROM jsonb_each(v_meters) e LOOP
            IF NOT EXISTS (SELECT 1 FROM public.usage_meters m WHERE m.key = v_meter) THEN
                RAISE EXCEPTION 'plan entitlements: unknown meter "%" for workflow "%"', v_meter, v_slug;
            END IF;
            IF NOT (jsonb_typeof(v_limit) = 'null'
                    OR (jsonb_typeof(v_limit) = 'number' AND (v_limit #>> '{}') ~ '^[0-9]+$')) THEN
                RAISE EXCEPTION 'plan entitlements: limit for "%"."%" must be a whole number or null', v_slug, v_meter;
            END IF;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$function$;

-- protect_payment_ledger: trigger: payments rows cannot be deleted, and amount/currency/ids/owner cannot change
CREATE OR REPLACE FUNCTION public.protect_payment_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'payments is a ledger: rows cannot be deleted';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.provider IS DISTINCT FROM OLD.provider
       OR NEW.provider_payment_id IS DISTINCT FROM OLD.provider_payment_id
       OR NEW.amount_minor IS DISTINCT FROM OLD.amount_minor
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'payments is a ledger: amount, currency, user and provider ids cannot be changed';
    END IF;
    RETURN NEW;
END;
$function$;

-- protect_system_plans: trigger: default system 'free' plan cannot be deleted or have its code altered
CREATE OR REPLACE FUNCTION public.protect_system_plans()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.code = 'free' THEN
            RAISE EXCEPTION 'System plan "%" cannot be deleted.', OLD.code;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.code = 'free' AND NEW.code <> 'free' THEN
            RAISE EXCEPTION 'Cannot change the code of system plan "%".', OLD.code;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$function$;

-- authenticate_gatekeeper: bot/web entry check: identity (user_id or telegram_id), account status, workflow access, expiry, quota (any exhausted meter => 429)
CREATE OR REPLACE FUNCTION public.authenticate_gatekeeper(
    p_user_id uuid DEFAULT NULL::uuid,
    p_telegram_id bigint DEFAULT NULL::bigint,
    p_workflow_slug text DEFAULT ''::text,
    p_username text DEFAULT NULL::text
)
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
    v_exceeded BOOLEAN;
    v_runs_limit BIGINT;
    v_runs_used BIGINT;
BEGIN
    -- 1. Authenticate via User UUID (Web) or Telegram ID (Bot)
    IF p_user_id IS NOT NULL THEN
        SELECT u.id, u.full_name, u.status, u.role, NULL::text AS handle INTO v_user
        FROM public.users u
        WHERE u.id = p_user_id;
    ELSIF p_telegram_id IS NOT NULL THEN
        SELECT u.id, u.full_name, u.status, u.role, i.handle INTO v_user
        FROM public.user_identities i
        JOIN public.users u ON u.id = i.user_id
        WHERE i.provider = 'telegram' AND i.provider_user_id = p_telegram_id::text;

        -- Keep the Telegram @handle current (written only when it changed)
        IF FOUND AND p_username IS NOT NULL AND p_username IS DISTINCT FROM v_user.handle THEN
            UPDATE public.user_identities ui
               SET handle = p_username
             WHERE ui.user_id = v_user.id AND ui.provider = 'telegram';
        END IF;
    ELSE
        RETURN QUERY SELECT false, 401, 'UNREGISTERED'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::public.user_role, NULL::INT4;
        RETURN;
    END IF;

    IF v_user.id IS NULL THEN
        RETURN QUERY SELECT false, 401, 'UNREGISTERED'::TEXT, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::public.user_role, NULL::INT4;
        RETURN;
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

    -- 4. Workflow permission and expiration (read-only)
    SELECT uwa.expires_at INTO v_access
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

    -- 4b. Quota: blocked if any meter that has a limit is exhausted
    --     (monthly meters whose period has elapsed count as 0 used)
    SELECT EXISTS (
        SELECT 1
        FROM public.access_usage au
        WHERE au.user_id = v_user.id
          AND au.workflow_id = v_workflow.id
          AND au.limit_value IS NOT NULL
          AND (CASE WHEN au.period = 'monthly' AND au.period_start + interval '1 month' <= now()
                    THEN 0 ELSE au.used END) >= au.limit_value
    ) INTO v_exceeded;

    IF v_exceeded THEN
        RETURN QUERY SELECT false, 429, 'QUOTA_EXCEEDED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, 0::INT4;
        RETURN;
    END IF;

    -- Remaining quota reported for the 'runs' meter (NULL = unlimited / no row)
    SELECT au.limit_value,
           CASE WHEN au.period = 'monthly' AND au.period_start + interval '1 month' <= now()
                THEN 0 ELSE au.used END
      INTO v_runs_limit, v_runs_used
    FROM public.access_usage au
    JOIN public.usage_meters m ON m.id = au.meter_id
    WHERE au.user_id = v_user.id AND au.workflow_id = v_workflow.id AND m.key = 'runs';

    -- 5. Authorized (200 OK). Usage is NOT consumed here; call consume_usage after success.
    RETURN QUERY SELECT
        true,
        200,
        'AUTHORIZED'::TEXT,
        v_user.id,
        v_workflow.id,
        v_first_name,
        v_user.role,
        CASE WHEN v_runs_limit IS NULL THEN NULL
             ELSE GREATEST(v_runs_limit - v_runs_used, 0)::INT4 END;
END;
$function$;

-- authenticate_gatekeeper: backward-compatible 3-arg overload for Telegram bot
CREATE OR REPLACE FUNCTION public.authenticate_gatekeeper(
    p_telegram_id bigint,
    p_workflow_slug text,
    p_username text DEFAULT NULL::text
)
 RETURNS TABLE(is_authorized boolean, status_code integer, error_code text, user_id uuid, workflow_id uuid, first_name text, user_role user_role, remaining_quota integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
    SELECT * FROM public.authenticate_gatekeeper(NULL::uuid, p_telegram_id, p_workflow_slug, p_username);
$$;

-- consume_usage: atomic usage consumption for any meter; allow_overshoot for AI tokens; a run is counted once per job
CREATE OR REPLACE FUNCTION public.consume_usage(p_user_id uuid, p_workflow_slug text, p_meter_key text DEFAULT 'runs'::text, p_quantity bigint DEFAULT 1, p_job_run_id uuid DEFAULT NULL::uuid, p_allow_overshoot boolean DEFAULT false)
 RETURNS TABLE(consumed boolean, remaining bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_workflow_id uuid;
    v_meter_id uuid;
    v_limit bigint;
    v_used bigint;
BEGIN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'p_quantity must be greater than 0';
    END IF;

    -- User must hold a non-expired access grant for this workflow
    SELECT w.id INTO v_workflow_id
    FROM public.workflows w
    JOIN public.user_workflow_access uwa ON uwa.workflow_id = w.id
    WHERE w.slug = p_workflow_slug
      AND uwa.user_id = p_user_id
      AND (uwa.expires_at IS NULL OR uwa.expires_at > now());

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::bigint;
        RETURN;
    END IF;

    SELECT m.id INTO v_meter_id FROM public.usage_meters m WHERE m.key = p_meter_key;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown usage meter: %', p_meter_key;
    END IF;

    BEGIN
        -- No row = no limit configured: usage is still tracked, unlimited
        INSERT INTO public.access_usage (user_id, workflow_id, meter_id)
        VALUES (p_user_id, v_workflow_id, v_meter_id)
        ON CONFLICT (user_id, workflow_id, meter_id) DO NOTHING;

        UPDATE public.access_usage au
           SET used = (CASE WHEN au.period = 'monthly' AND au.period_start + interval '1 month' <= now()
                            THEN 0 ELSE au.used END) + p_quantity,
               period_start = CASE WHEN au.period = 'monthly' AND au.period_start + interval '1 month' <= now()
                                   THEN now() ELSE au.period_start END
         WHERE au.user_id = p_user_id
           AND au.workflow_id = v_workflow_id
           AND au.meter_id = v_meter_id
           AND (p_allow_overshoot
                OR au.limit_value IS NULL
                OR (CASE WHEN au.period = 'monthly' AND au.period_start + interval '1 month' <= now()
                         THEN 0 ELSE au.used END) + p_quantity <= au.limit_value)
        RETURNING au.limit_value, au.used INTO v_limit, v_used;

        IF NOT FOUND THEN
            RETURN QUERY SELECT false, NULL::bigint;   -- limit reached
            RETURN;
        END IF;

        IF p_job_run_id IS NOT NULL THEN
            -- Count a run only once per job, and only for the owner's own run of THIS workflow
            IF p_meter_key = 'runs' THEN
                UPDATE public.job_runs jr
                   SET usage_consumed_at = now()
                 WHERE jr.id = p_job_run_id AND jr.user_id = p_user_id AND jr.workflow_id = v_workflow_id
                   AND jr.usage_consumed_at IS NULL;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'already consumed or not this run' USING ERRCODE = 'UC001';  -- rolls back this block
                END IF;
            END IF;

            UPDATE public.job_runs jr
               SET usage = jsonb_set(
                     COALESCE(jr.usage, '{}'::jsonb),
                     ARRAY[p_meter_key],
                     to_jsonb(COALESCE((jr.usage ->> p_meter_key)::bigint, 0) + p_quantity))
             WHERE jr.id = p_job_run_id AND jr.user_id = p_user_id AND jr.workflow_id = v_workflow_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'run does not belong to this user and workflow' USING ERRCODE = 'UC001';
            END IF;
        END IF;

        UPDATE public.user_workflow_access uwa
           SET last_used_at = now()
         WHERE uwa.user_id = p_user_id AND uwa.workflow_id = v_workflow_id;
    EXCEPTION WHEN SQLSTATE 'UC001' THEN
        RETURN QUERY SELECT false, NULL::bigint;
        RETURN;
    END;

    RETURN QUERY SELECT true,
        CASE WHEN v_limit IS NULL THEN NULL ELSE GREATEST(v_limit - v_used, 0) END;
END;
$function$;

-- consume_workflow_usage: backward-compatible wrapper: one 'runs' unit
CREATE OR REPLACE FUNCTION public.consume_workflow_usage(p_user_id uuid, p_workflow_slug text)
 RETURNS TABLE(consumed boolean, remaining_quota integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT c.consumed, c.remaining::integer
    FROM public.consume_usage(p_user_id, p_workflow_slug, 'runs', 1, NULL, false) c;
END;
$function$;

-- apply_plan_entitlements: payment webhook: grants ONLY the plan's workflows; validates subscription, status and expiry; ends dropped workflows
CREATE OR REPLACE FUNCTION public.apply_plan_entitlements(p_user_id uuid, p_plan_id uuid, p_subscription_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_plan RECORD;
    v_wf RECORD;
    v_m RECORD;
    v_workflow_id uuid;
    v_meter_id uuid;
    v_period text;
    v_granted uuid[] := '{}';
    v_sub_status text;
    v_sub_end timestamptz;
    v_expires timestamptz;
BEGIN
    SELECT p.entitlements, p.billing_interval INTO v_plan
    FROM public.plans p
    WHERE p.id = p_plan_id AND p.is_active;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'plan % not found or inactive', p_plan_id;
    END IF;

    IF p_subscription_id IS NOT NULL THEN
        SELECT s.status, s.current_period_end INTO v_sub_status, v_sub_end
        FROM public.subscriptions s
        WHERE s.id = p_subscription_id AND s.user_id = p_user_id AND s.plan_id = p_plan_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'subscription % does not belong to this user and plan', p_subscription_id;
        END IF;
        IF v_sub_status NOT IN ('active', 'trialing', 'past_due') THEN
            RAISE EXCEPTION 'subscription % is %: access not granted', p_subscription_id, v_sub_status;
        END IF;
    END IF;

    v_expires := COALESCE(p_expires_at, v_sub_end);

    IF v_plan.billing_interval IN ('month', 'year') THEN
        IF p_subscription_id IS NULL THEN
            RAISE EXCEPTION 'recurring plan requires a subscription';
        END IF;
        IF v_expires IS NULL THEN
            RAISE EXCEPTION 'recurring plan requires an expiry (p_expires_at or the subscription current_period_end)';
        END IF;
    END IF;

    IF v_expires IS NOT NULL AND v_expires <= now() THEN
        RAISE EXCEPTION 'expiry % is in the past', v_expires;
    END IF;

    v_period := CASE WHEN v_plan.billing_interval = 'month' THEN 'monthly' ELSE 'lifetime' END;

    FOR v_wf IN SELECT e.key AS slug, e.value AS meters FROM jsonb_each(v_plan.entitlements) e LOOP
        SELECT w.id INTO v_workflow_id FROM public.workflows w WHERE w.slug = v_wf.slug;
        IF v_workflow_id IS NULL THEN
            RAISE WARNING 'apply_plan_entitlements: workflow "%" no longer exists, skipped', v_wf.slug;
            CONTINUE;
        END IF;

        INSERT INTO public.user_workflow_access (user_id, workflow_id, granted_via, subscription_id, expires_at)
        VALUES (p_user_id, v_workflow_id, 'payment', p_subscription_id, v_expires)
        ON CONFLICT (user_id, workflow_id) DO UPDATE
           SET granted_via = 'payment',
               subscription_id = EXCLUDED.subscription_id,
               expires_at = EXCLUDED.expires_at;

        v_granted := v_granted || v_workflow_id;

        FOR v_m IN SELECT e.key AS meter_key, e.value AS lim FROM jsonb_each(v_wf.meters) e LOOP
            SELECT m.id INTO v_meter_id FROM public.usage_meters m WHERE m.key = v_m.meter_key;
            IF v_meter_id IS NULL THEN
                RAISE WARNING 'apply_plan_entitlements: meter "%" no longer exists, skipped', v_m.meter_key;
                CONTINUE;
            END IF;

            INSERT INTO public.access_usage (user_id, workflow_id, meter_id, used, limit_value, period, period_start)
            VALUES (p_user_id, v_workflow_id, v_meter_id, 0,
                    CASE WHEN jsonb_typeof(v_m.lim) = 'null' THEN NULL ELSE (v_m.lim #>> '{}')::bigint END,
                    v_period, now())
            ON CONFLICT (user_id, workflow_id, meter_id) DO UPDATE
               SET used = 0,
                   limit_value = EXCLUDED.limit_value,
                   period = EXCLUDED.period,
                   period_start = now();
        END LOOP;
    END LOOP;

    -- Workflows this subscription granted before but the plan no longer includes
    IF p_subscription_id IS NOT NULL THEN
        UPDATE public.user_workflow_access uwa
           SET expires_at = now()
         WHERE uwa.user_id = p_user_id
           AND uwa.subscription_id = p_subscription_id
           AND NOT (uwa.workflow_id = ANY (v_granted))
           AND (uwa.expires_at IS NULL OR uwa.expires_at > now());
    END IF;

    RETURN COALESCE(array_length(v_granted, 1), 0);
END;
$function$;

-- revoke_subscription_access: payment webhook: ends every workflow a canceled/refunded subscription granted
CREATE OR REPLACE FUNCTION public.revoke_subscription_access(p_subscription_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
BEGIN
    UPDATE public.user_workflow_access uwa
       SET expires_at = now()
     WHERE uwa.subscription_id = p_subscription_id
       AND (uwa.expires_at IS NULL OR uwa.expires_at > now());
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$;

-- purge_expired_locked_users: retention procedure to clean up soft-deleted/locked accounts older than retention period
CREATE OR REPLACE FUNCTION public.purge_expired_locked_users(p_older_than interval DEFAULT interval '90 days')
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_purged_count integer := 0;
    v_user RECORD;
BEGIN
    FOR v_user IN
        SELECT id FROM public.users
        WHERE status = 'locked' AND updated_at < now() - p_older_than
    LOOP
        -- Privacy & GDPR compliance: if payments exist, retain ledger but anonymize PII
        IF EXISTS (SELECT 1 FROM public.payments WHERE user_id = v_user.id) THEN
            UPDATE public.users
               SET full_name = 'Deleted User',
                   email = NULL,
                   reason_for_access = NULL,
                   updated_at = now()
             WHERE id = v_user.id;

            DELETE FROM public.user_identities WHERE user_id = v_user.id;
            DELETE FROM public.user_workflow_access WHERE user_id = v_user.id;
            DELETE FROM public.workflow_access_requests WHERE user_id = v_user.id;
            DELETE FROM public.job_runs WHERE user_id = v_user.id;
        ELSE
            -- Hard delete cascades to identities, access, job_runs
            DELETE FROM public.users WHERE id = v_user.id;
        END IF;

        v_purged_count := v_purged_count + 1;
    END LOOP;

    RETURN v_purged_count;
END;
$function$;

-- register_telegram_user: creates user + telegram identity (race-safe)
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
        INSERT INTO public.users (full_name, preferred_language)
        VALUES (p_full_name, p_preferred_language)
        RETURNING id INTO v_user;

        INSERT INTO public.user_identities (user_id, provider, provider_user_id, handle)
        VALUES (v_user, 'telegram', p_telegram_id::text, p_username);
    EXCEPTION WHEN unique_violation THEN
        -- Lost a race with a concurrent registration (the user insert above is rolled
        -- back with this block): return the winner.
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

-- set_credential: stores/updates a credential secret in vault
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

-- get_credential: reads a credential secret from vault
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

-- delete_credential_secret: trigger: removes the vault secret when a credential row is deleted
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
-- 8. TRIGGERS
-- ---------------------------------------------------------------------
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_access_requests_updated_at BEFORE UPDATE ON public.workflow_access_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_workflow_credentials_updated_at BEFORE UPDATE ON public.workflow_credentials FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_delete_credential_secret AFTER DELETE ON public.workflow_credentials FOR EACH ROW EXECUTE FUNCTION delete_credential_secret();
CREATE TRIGGER set_job_runs_updated_at BEFORE UPDATE ON public.job_runs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_access_usage_updated_at BEFORE UPDATE ON public.access_usage FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER validate_plan_entitlements BEFORE INSERT OR UPDATE OF entitlements ON public.plans FOR EACH ROW EXECUTE FUNCTION validate_plan_entitlements();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER protect_payments_ledger BEFORE DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION protect_payment_ledger();
CREATE TRIGGER protect_system_plans BEFORE DELETE OR UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION protect_system_plans();

-- ---------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (no policies = service_role / backend only)
-- ---------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workflow_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 9b. COLUMN COMMENTS (shown in Supabase Studio)
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.access_usage.limit_value IS 'NULL = unlimited.';
COMMENT ON COLUMN public.job_runs.usage IS 'What this run consumed, per meter, e.g. {"runs":1,"ai_tokens":1840}.';
COMMENT ON COLUMN public.job_runs.input IS 'What the workflow was asked to do. Free-form JSON object, shape defined by each workflow.';
COMMENT ON COLUMN public.job_runs.output IS 'What the workflow produced. Free-form JSON, shape defined by each workflow. NULL until finished.';
COMMENT ON COLUMN public.plans.entitlements IS 'The specific workflows a plan grants and the limit per meter (null = unlimited): {"job-xray": {"runs": 50, "ai_tokens": 200000}}';
COMMENT ON COLUMN public.user_identities.provider_user_id IS 'The provider''s permanent id for the person (for Telegram: the numeric Telegram user id). Never changes.';
COMMENT ON COLUMN public.user_identities.handle IS 'The human-readable public name on that provider (for Telegram: the @username, without the @). It can change or be missing, so it is for display only; always identify people by provider_user_id.';
COMMENT ON COLUMN public.user_workflow_access.metadata IS 'Workflow-specific preferences only (e.g. {"cv": "https://...", "sendEmail": true}). Generic profile attributes live in public.users.';
COMMENT ON COLUMN public.users.role IS 'admin: everything. editor: manage workflows, access and requests. viewer: read-only admin panel. user: normal user. guest: limited user. Enforced by the app.';

-- ---------------------------------------------------------------------
-- 10. PRIVILEGES
-- ---------------------------------------------------------------------
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- RPCs the backend calls: service_role only
GRANT EXECUTE ON FUNCTION public.authenticate_gatekeeper(uuid, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_usage(uuid, text, text, bigint, uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_workflow_usage(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_plan_entitlements(uuid, uuid, uuid, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_subscription_access(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_expired_locked_users(interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_telegram_user(bigint, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_credential(uuid, uuid, text, credential_auth_type, jsonb, text[], jsonb, timestamp with time zone) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credential(uuid, uuid, text) TO service_role;

-- Trigger functions: not callable by anyone (triggers still fire)
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM service_role;
REVOKE ALL ON FUNCTION public.validate_plan_entitlements() FROM service_role;
REVOKE ALL ON FUNCTION public.protect_payment_ledger() FROM service_role;
REVOKE ALL ON FUNCTION public.delete_credential_secret() FROM service_role;

-- ---------------------------------------------------------------------
-- 11. SEED DATA (reference data the functions rely on)
-- ---------------------------------------------------------------------
INSERT INTO public.usage_meters (key, name, unit) VALUES
  ('runs',      'Workflow runs', 'run'),
  ('ai_tokens', 'AI tokens',     'token')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 12. STORAGE
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('workflow-images', 'workflow-images', true, 10485760, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;
