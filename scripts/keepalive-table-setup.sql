-- ============================================================
-- Supabase Keep-Alive Table Setup
-- Run this once in the Supabase SQL Editor (or via psql).
-- ============================================================

-- Create the lightweight sentinel table used by /api/cron/keep-alive.
-- Uses a single row (id=1) updated on each ping so it never grows.
CREATE TABLE IF NOT EXISTS public._keepalive (
  id        INT          PRIMARY KEY,
  last_ping TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed the single sentinel row
INSERT INTO public._keepalive (id, last_ping)
VALUES (1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant the service_role key full DML access.
-- (service_role bypasses RLS, so explicit grants are needed for PostgREST.)
GRANT SELECT, INSERT, UPDATE ON TABLE public._keepalive TO service_role;

-- Enable Row Level Security (required by AGENTS.md rule — no client key
-- will ever touch this table, but RLS must be ON as a matter of policy).
ALTER TABLE public._keepalive ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (this is Supabase default behaviour but
-- stated explicitly here for clarity).
-- No anon/authenticated policies are created — this table is internal only.
