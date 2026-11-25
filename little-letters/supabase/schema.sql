-- Run once in a NEW Supabase project's SQL Editor.
-- All letter mutations go through the authenticated Vercel API.
begin;

create table public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null unique check (role in ('admin', 'reader'))
);

create table public.letters (
  id uuid primary key,
  title text not null default '' check (length(title) <= 140),
  greeting text not null default '' check (length(greeting) <= 160),
  body text not null default '' check (length(body) <= 20000),
  signature text not null default '' check (length(signature) <= 160),
  stationery_style text not null default 'cream' check (stationery_style in ('cream','sage','blush','butter')),
  status text not null default 'draft' check (status in ('draft','sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  version integer not null default 1,
  notification_status text not null default 'none' check (notification_status in ('none','pending','sending','accepted','failed','unconfigured','unavailable')),
  notification_note text not null default '',
  notification_started_at timestamptz,
  check (status <> 'sent' or (sent_at is not null and length(trim(body)) > 0))
);
create index letters_status_sent on public.letters (status, sent_at desc, id);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.members(user_id) on delete cascade,
  endpoint text not null unique check (length(endpoint) < 3000),
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.letters enable row level security;
alter table public.push_subscriptions enable row level security;

revoke all on public.members, public.letters, public.push_subscriptions from anon, authenticated;
grant select on public.members, public.letters to authenticated;
grant all on public.members, public.letters, public.push_subscriptions to service_role;

create policy own_membership on public.members for select to authenticated using (user_id = (select auth.uid()));
create policy private_letters on public.letters for select to authenticated using (
  exists (select 1 from public.members m where m.user_id = (select auth.uid()) and
    (m.role = 'admin' or (m.role = 'reader' and status = 'sent')))
);
-- No client write policies. Readers cannot edit letters, their roles, or drafts.
-- Subscriptions are only accessible through the server API.

create function public.save_letter(p_id uuid, p_content jsonb, p_version integer, p_action text)
returns jsonb language plpgsql set search_path = public as $$
declare item public.letters;
begin
  if p_action not in ('save','publish','edit_sent') then raise exception 'Invalid action' using errcode = '22023'; end if;
  -- Serialize even the first insert for this UUID. A retry can never create a second letter.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select * into item from public.letters where id = p_id for update;

  if found then
    -- Replaying a publish never edits the already-published letter or sends it twice.
    if p_action = 'publish' and item.status = 'sent' then return to_jsonb(item); end if;
    if p_action = 'save' and item.status = 'sent' then
      raise exception 'This letter was sent. Reopen it to edit.' using errcode = '40001';
    end if;
    if p_action = 'edit_sent' and item.status <> 'sent' then
      raise exception 'This letter has not been sent.' using errcode = '40001';
    end if;
    if item.version <> p_version then
      raise exception 'This letter changed elsewhere. Reload before saving.' using errcode = '40001';
    end if;
  else
    if p_version <> 0 or p_action = 'edit_sent' then
      raise exception 'This letter no longer exists. Reload before saving.' using errcode = '40001';
    end if;
    insert into public.letters (id, version) values (p_id, 0) returning * into item;
  end if;

  update public.letters set
    title = trim(coalesce(p_content->>'title','')),
    greeting = trim(coalesce(p_content->>'greeting','')),
    body = coalesce(p_content->>'body',''),
    signature = trim(coalesce(p_content->>'signature','')),
    stationery_style = coalesce(p_content->>'stationeryStyle','cream'),
    status = case when p_action = 'publish' then 'sent' else item.status end,
    sent_at = case when p_action = 'publish' then now() else item.sent_at end,
    notification_status = case when p_action = 'publish' then 'pending' else item.notification_status end,
    version = item.version + 1, updated_at = now()
  where id = p_id returning * into item;
  return to_jsonb(item);
end;
$$;

-- A lease prevents simultaneous sends/retries. A crashed request can be retried after 2 minutes.
create function public.claim_notification(p_id uuid, p_retry boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare claimed uuid;
begin
  update public.letters set notification_status = 'sending', notification_started_at = now()
  where id = p_id and status = 'sent' and (
    notification_status = 'pending' or
    (p_retry and notification_status in ('failed','unconfigured','unavailable')) or
    (notification_status = 'sending' and notification_started_at < now() - interval '2 minutes')
  ) returning id into claimed;
  return claimed is not null;
end;
$$;

revoke all on function public.save_letter(uuid,jsonb,integer,text) from public, anon, authenticated;
revoke all on function public.claim_notification(uuid,boolean) from public, anon, authenticated;
grant execute on function public.save_letter(uuid,jsonb,integer,text) to service_role;
grant execute on function public.claim_notification(uuid,boolean) to service_role;
commit;
