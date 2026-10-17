-- ============================================================================
-- Schema export: Supabase project mfikrhuzewundqlzwcad (public schema)
-- Target: any PostgreSQL 13+ (gen_random_uuid() is built in from PG13)
-- Contents: enums, tables, indexes, functions, triggers. Schema only, no data.
-- Run order matters: enums -> tables -> indexes -> functions -> triggers.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Enum types
-- ----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'guest');
CREATE TYPE public.access_status AS ENUM ('pending', 'approved', 'rejected', 'locked');

-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------
CREATE TABLE public.users (
    id                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
    telegram_id        bigint                   NOT NULL,
    username           text,
    full_name          text                     NOT NULL,
    reason_for_access  text,
    role               public.user_role         NOT NULL DEFAULT 'user'::public.user_role,
    status             public.access_status     NOT NULL DEFAULT 'pending'::public.access_status,
    created_at         timestamp with time zone NOT NULL DEFAULT now(),
    updated_at         timestamp with time zone NOT NULL DEFAULT now(),
    preferred_language text                              DEFAULT 'ar'::text,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_telegram_id_key UNIQUE (telegram_id)
);

CREATE TABLE public.workflows (
    id         uuid                     NOT NULL DEFAULT gen_random_uuid(),
    slug       text                     NOT NULL,
    name       text                     NOT NULL,
    is_active  boolean                  NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
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
    expires_at   timestamp with time zone,
    metadata     jsonb                             DEFAULT '{}'::jsonb,
    CONSTRAINT user_workflow_access_pkey PRIMARY KEY (user_id, workflow_id),
    CONSTRAINT user_workflow_access_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT user_workflow_access_workflow_id_fkey
        FOREIGN KEY (workflow_id) REFERENCES public.workflows (id) ON DELETE CASCADE
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

    -- Optional Security Sync: Keep Telegram username updated if they changed it
    IF p_username IS NOT NULL AND p_username IS DISTINCT FROM v_user.username THEN
        UPDATE public.users SET username = p_username WHERE id = v_user.id;
    END IF;

    v_first_name := split_part(v_user.full_name, ' ', 1);

    -- 2. Check Global Account Status (423 Locked, 403 Pending/Rejected)
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

    -- 3. Validate Workflow Resource (503 if disabled/maintenance, 403 if not found)
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

    -- 4. Check Workflow Permission, Expiration & Quota (read-only)
    SELECT uwa.usage_count, uwa.usage_limit, uwa.expires_at INTO v_access
    FROM public.user_workflow_access uwa
    WHERE uwa.user_id = v_user.id AND uwa.workflow_id = v_workflow.id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 403, 'WORKFLOW_FORBIDDEN'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, NULL::INT4;
        RETURN;
    END IF;

    -- Time-based Access Expiration (403)
    IF v_access.expires_at IS NOT NULL AND v_access.expires_at < now() THEN
        RETURN QUERY SELECT false, 403, 'ACCESS_EXPIRED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, 0::INT4;
        RETURN;
    END IF;

    -- Quota Validation (429 Too Many Requests)
    IF v_access.usage_limit IS NOT NULL AND v_access.usage_count >= v_access.usage_limit THEN
        RETURN QUERY SELECT false, 429, 'QUOTA_EXCEEDED'::TEXT, v_user.id, v_workflow.id, v_first_name, v_user.role, 0::INT4;
        RETURN;
    END IF;

    -- 5. Authorized (200 OK). Usage is NOT consumed here;
    --    call consume_workflow_usage() after the workflow succeeds.
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

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;

-- ----------------------------------------------------------------------------
-- Supabase-specific: restrict both functions to the backend (service_role).
-- On another provider, revoke EXECUTE from any role your client keys use.
-- ----------------------------------------------------------------------------
-- REVOKE ALL ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) FROM PUBLIC, anon, authenticated;
-- REVOKE ALL ON FUNCTION public.consume_workflow_usage(uuid, text) FROM PUBLIC, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.authenticate_gatekeeper(bigint, text, text) TO service_role;
-- GRANT EXECUTE ON FUNCTION public.consume_workflow_usage(uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- Optional: if the new provider exposes these tables to client-side keys,
-- enable Row Level Security (it was DISABLED on the source database).
-- Enabling RLS with no policies blocks everything except the table owner /
-- service role, so only run it if your backend connects with a privileged role.
-- ----------------------------------------------------------------------------
-- ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workflows            ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_workflow_access ENABLE ROW LEVEL SECURITY;
