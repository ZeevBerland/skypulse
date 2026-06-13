-- Competitor intelligence feed
create table competitor_updates (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  competitor_name text not null,
  competitor_address text,
  update_type     text not null check (update_type in ('promotion', 'review_trend', 'new_product', 'price_change', 'store_change', 'news', 'social_media', 'other')),
  title           text not null,
  summary         text not null,
  source_url      text,
  relevance_score double precision not null default 0.5,
  ai_suggestion   text,
  raw_json        jsonb not null default '{}'::jsonb,
  discovered_at   timestamptz not null default now()
);

create index idx_competitor_updates_business on competitor_updates(business_id, discovered_at desc);
