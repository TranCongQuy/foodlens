-- ====================================================================
-- MIGRATION 003: SECURE UNRESTRICTED ANALYTICS VIEWS
-- Enforces Row Level Security (RLS) on analytical views via security_invoker
-- and revokes public / anon privileges to prevent administrative data leakage.
-- ====================================================================

-- 1. Enable security_invoker on all 3 views so queries execute under the caller's RLS context
alter view public.v_daily_stats set (security_invoker = true);
alter view public.v_cost_by_day set (security_invoker = true);
alter view public.v_ai_admin_agreement set (security_invoker = true);

-- 2. Revoke all permissions from anon role
revoke all on public.v_daily_stats from anon;
revoke all on public.v_cost_by_day from anon;
revoke all on public.v_ai_admin_agreement from anon;

-- 3. Explicitly grant SELECT only to authenticated users (who will still be filtered by RLS)
grant select on public.v_daily_stats to authenticated;
grant select on public.v_cost_by_day to authenticated;
grant select on public.v_ai_admin_agreement to authenticated;

-- Comment for security audit documentation
comment on view public.v_daily_stats is 'Daily story moderation and volume statistics (RLS enforced via security_invoker)';
comment on view public.v_cost_by_day is 'Daily AI token usage and cost tracking (RLS enforced via security_invoker)';
comment on view public.v_ai_admin_agreement is 'Agreement rate between AI risk scoring and Admin moderation decisions (RLS enforced via security_invoker)';
