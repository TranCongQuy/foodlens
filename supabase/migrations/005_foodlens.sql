-- ====================================================================
-- MIGRATION: 005_foodlens.sql
-- PROJECT: FoodLens - bảng lịch sử phân tích món ăn (dùng chung project DrawToStory)
-- Idempotent: chạy lại không lỗi.
-- ====================================================================

-- 1. FOOD ANALYSES TABLE
create table if not exists public.food_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  dish_name text not null,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  calories integer not null default 0 check (calories >= 0),
  protein_g numeric not null default 0 check (protein_g >= 0),
  fat_g numeric not null default 0 check (fat_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  health_score integer not null default 5 check (health_score between 1 and 10),
  items jsonb not null default '[]'::jsonb,
  tips text,
  thumbnail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_food_analyses_user_created
  on public.food_analyses (user_id, created_at desc);

-- 2. ROW LEVEL SECURITY: user chỉ xem/thêm dòng của chính mình
alter table public.food_analyses enable row level security;

drop policy if exists "Users view own food analyses" on public.food_analyses;
create policy "Users view own food analyses"
  on public.food_analyses for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users insert own food analyses" on public.food_analyses;
create policy "Users insert own food analyses"
  on public.food_analyses for insert
  with check (user_id = auth.uid());
