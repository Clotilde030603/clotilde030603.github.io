create extension if not exists pgcrypto with schema extensions;

create type public.post_status as enum ('draft', 'published', 'unpublished', 'trashed');
create type public.comment_status as enum ('pending', 'published', 'spam', 'deleted');
create type public.deployment_status as enum ('requested', 'building', 'live', 'failed', 'superseded');
create type public.media_visibility as enum ('private', 'public');

create table public.owner_accounts (
  user_id uuid primary key references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  parent_id uuid references public.categories(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id is distinct from parent_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.post_status not null default 'draft',
  current_publication_id uuid,
  comments_enabled boolean not null default true,
  comments_visible boolean not null default true,
  pinned boolean not null default false,
  position integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (bucket_id in ('draft-media', 'published-media')),
  object_path text not null,
  visibility public.media_visibility not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 20971520),
  alt_text text not null default '',
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path),
  check ((bucket_id = 'draft-media' and visibility = 'private') or
         (bucket_id = 'published-media' and visibility = 'public'))
);

create table public.drafts (
  post_id uuid primary key references public.posts(id) on delete cascade,
  title text not null default '제목 없음' check (char_length(title) between 1 and 200),
  summary text not null default '' check (char_length(summary) <= 500),
  category_id uuid references public.categories(id) on delete set null,
  tags text[] not null default '{}',
  document jsonb not null default '{"schemaVersion":1,"content":{"type":"doc","content":[]}}'::jsonb,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  original_created_at timestamptz,
  source_url text,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(document) = 'object'),
  check ((document ->> 'schemaVersion')::integer = 1),
  check (jsonb_typeof(document -> 'content') = 'object'),
  check (source_url is null or source_url ~ '^https?://')
);

create table public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  version bigint not null,
  snapshot jsonb not null,
  reason text not null default 'save' check (reason in ('save', 'publish', 'restore', 'import')),
  created_at timestamptz not null default now(),
  unique (post_id, version)
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete restrict,
  draft_version bigint not null,
  slug text not null,
  title text not null,
  summary text not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text,
  tags text[] not null default '{}',
  document jsonb not null,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  original_created_at timestamptz,
  source_url text,
  comments_enabled boolean not null,
  comments_visible boolean not null,
  published_at timestamptz not null default now(),
  unique (post_id, draft_version),
  check ((document ->> 'schemaVersion')::integer = 1)
);

alter table public.posts
  add constraint posts_current_publication_fk
  foreign key (current_publication_id) references public.publications(id) on delete set null;

create table public.slug_aliases (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((document ->> 'schemaVersion')::integer = 1)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete set null,
  nickname text not null check (char_length(nickname) between 1 and 40),
  body text not null check (char_length(body) between 1 and 2000),
  website text check (website is null or website ~ '^https://'),
  status public.comment_status not null default 'pending',
  submission_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (parent_id is null or parent_id <> id)
);

create index comments_post_created_idx on public.comments(post_id, created_at);
create index comments_submission_idx on public.comments(submission_hash, created_at);

create table public.view_events (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  session_hash text not null,
  request_hash text not null,
  dedupe_bucket timestamptz not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (post_id, session_hash, dedupe_bucket)
);

create index view_events_occurred_idx on public.view_events(occurred_at);
create index view_events_rate_idx on public.view_events(request_hash, occurred_at);

create table public.deployments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid references public.publications(id) on delete set null,
  kind text not null check (kind in ('publish', 'unpublish')),
  status public.deployment_status not null default 'requested',
  github_run_id bigint,
  manifest jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('notion-markdown', 'notion-html', 'paste-html', 'tistory-html', 'dorami-backup')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  original_name text,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.import_warnings (
  id bigint generated always as identity primary key,
  import_job_id uuid not null references public.import_jobs(id) on delete cascade,
  item_path text,
  code text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_owner(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select check_user_id is not null and exists (
    select 1 from public.owner_accounts where user_id = check_user_id
  );
$$;

create or replace function public.build_public_manifest(p_deployment_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with recursive published_categories(id) as (
    select distinct pub.category_id
    from public.posts p join public.publications pub on pub.id=p.current_publication_id
    where p.status='published' and p.deleted_at is null and pub.category_id is not null
    union
    select c.parent_id from public.categories c join published_categories pc on c.id=pc.id where c.parent_id is not null
  ), category_rows as (
    select c.* from public.categories c join published_categories pc on pc.id=c.id
  ), post_rows as (
    select pub.*,p.comments_enabled as live_comments_enabled,p.comments_visible as live_comments_visible
    from public.posts p join public.publications pub on pub.id=p.current_publication_id
    where p.status='published' and p.deleted_at is null
  )
  select jsonb_build_object(
    'schemaVersion',1,'deploymentId',p_deployment_id,'generatedAt',now(),
    'categories',coalesce((select jsonb_agg(jsonb_build_object(
      'id',id,'name',name,'slug',slug,'parentId',parent_id,'position',position
    ) order by position,name) from category_rows),'[]'::jsonb),
    'posts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',post_id,'slug',slug,'title',title,'summary',summary,'categoryId',category_id,
      'tags',tags,'document',document,'publishedAt',published_at,'updatedAt',published_at,
      'commentsEnabled',live_comments_enabled,'commentsVisible',live_comments_visible,'sourceUrl',source_url
    ) order by published_at desc) from post_rows),'[]'::jsonb),
    'slugAliases',coalesce((select jsonb_agg(jsonb_build_object(
      'slug',a.slug,'postId',a.post_id,'targetSlug',pub.slug
    ) order by a.slug)
      from public.slug_aliases a
      join public.posts p on p.id=a.post_id
      join public.publications pub on pub.id=p.current_publication_id
      where p.status='published' and p.deleted_at is null and a.slug<>pub.slug
    ),'[]'::jsonb),
    'about',null
  );
$$;

revoke all on function public.build_public_manifest(uuid) from public;
grant execute on function public.build_public_manifest(uuid) to service_role;

revoke all on function public.is_owner(uuid) from public;
grant execute on function public.is_owner(uuid) to anon, authenticated, service_role;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_touch before update on public.categories
for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
for each row execute function public.touch_updated_at();
create trigger comments_touch before update on public.comments
for each row execute function public.touch_updated_at();
create trigger templates_touch before update on public.templates
for each row execute function public.touch_updated_at();

create or replace function public.prevent_category_cycle()
returns trigger language plpgsql set search_path = '' as $$
declare cycle_found boolean;
declare tree_depth integer;
begin
  if new.parent_id is null then return new; end if;
  with recursive ancestors(id, parent_id, depth) as (
    select c.id, c.parent_id, 1 from public.categories c where c.id = new.parent_id
    union all
    select c.id, c.parent_id, a.depth + 1
    from public.categories c join ancestors a on c.id = a.parent_id
    where a.depth < 32
  )
  select coalesce(bool_or(id = new.id), false), coalesce(max(depth), 0)
  into cycle_found, tree_depth from ancestors;
  if cycle_found then raise exception 'category cycle is not allowed' using errcode = '23514'; end if;
  if tree_depth >= 16 then raise exception 'category depth exceeds 16' using errcode = '23514'; end if;
  return new;
end;
$$;

create trigger categories_no_cycle before insert or update of parent_id on public.categories
for each row execute function public.prevent_category_cycle();

create or replace function public.preserve_post_slug()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.slug_aliases where slug=new.slug and post_id<>new.id) then
    raise exception 'slug is reserved by an existing alias' using errcode='23505';
  end if;
  delete from public.slug_aliases where slug=new.slug and post_id=new.id;
  if tg_op='UPDATE' and new.slug<>old.slug and old.slug not like 'draft-%' then
    insert into public.slug_aliases(slug,post_id) values(old.slug,new.id)
    on conflict(slug) do nothing;
  end if;
  return new;
end;
$$;

create trigger posts_preserve_slug before insert or update of slug on public.posts
for each row execute function public.preserve_post_slug();

create or replace function public.create_draft_post(
  p_title text default '제목 없음', p_category_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid := gen_random_uuid();
declare new_slug text;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode = '42501'; end if;
  if p_title is null or char_length(trim(p_title)) = 0 then p_title := '제목 없음'; end if;
  new_slug := 'draft-' || replace(new_id::text, '-', '');
  insert into public.posts(id, slug) values (new_id, new_slug);
  insert into public.drafts(post_id, title, category_id) values (new_id, left(trim(p_title), 200), p_category_id);
  insert into public.draft_versions(post_id, version, snapshot, reason)
  select new_id, 1, to_jsonb(d), 'save' from public.drafts d where d.post_id = new_id;
  return new_id;
end;
$$;

create or replace function public.save_draft(
  p_post_id uuid,
  p_expected_version bigint,
  p_title text,
  p_summary text,
  p_category_id uuid,
  p_tags text[],
  p_document jsonb,
  p_cover_media_id uuid default null,
  p_original_created_at timestamptz default null,
  p_source_url text default null
) returns public.drafts
language plpgsql security definer set search_path = '' as $$
declare saved public.drafts;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode = '42501'; end if;
  if p_expected_version is null then raise exception 'expected version is required' using errcode = '22023'; end if;
  update public.drafts set
    title = p_title, summary = coalesce(p_summary, ''), category_id = p_category_id,
    tags = coalesce(p_tags, '{}'), document = p_document,
    cover_media_id = p_cover_media_id, original_created_at = p_original_created_at,
    source_url = p_source_url, version = version + 1, updated_at = now()
  where post_id = p_post_id and version = p_expected_version
  returning * into saved;
  if saved.post_id is null then
    raise exception 'draft version conflict' using errcode = '40001', hint = 'Reload the server draft and compare it with the local recovery copy.';
  end if;
  insert into public.draft_versions(post_id, version, snapshot, reason)
  values (saved.post_id, saved.version, to_jsonb(saved), 'save');
  return saved;
end;
$$;

create or replace function public.publish_post(
  p_post_id uuid, p_expected_version bigint, p_published_document jsonb, p_published_cover_media_id uuid default null
)
returns table(publication_id uuid, deployment_id uuid)
language plpgsql security definer set search_path = '' as $$
declare d public.drafts;
declare p public.posts;
declare pub_id uuid;
declare dep_id uuid := gen_random_uuid();
declare category_label text;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dorami-publication'));
  select * into d from public.drafts where post_id = p_post_id for update;
  if d.post_id is null then raise exception 'draft not found' using errcode = 'P0002'; end if;
  if d.version <> p_expected_version then raise exception 'draft version conflict' using errcode = '40001'; end if;
  select * into p from public.posts where id = p_post_id for update;
  if p.deleted_at is not null then raise exception 'trashed post cannot be published' using errcode = '23514'; end if;
  if p.slug like 'draft-%' then raise exception 'choose a public slug before publishing' using errcode = '23514'; end if;
  if (p_published_document->>'schemaVersion')::integer <> 1 or jsonb_typeof(p_published_document->'content') <> 'object' then
    raise exception 'invalid published document' using errcode = '22023';
  end if;
  if p_published_document::text like '%import-asset:%' or p_published_document::text like '%draft-media%' then
    raise exception 'published document contains unresolved private media' using errcode = '23514';
  end if;
  if p_published_cover_media_id is not null and not exists(
    select 1 from public.media_assets where id=p_published_cover_media_id and visibility='public' and bucket_id='published-media'
  ) then raise exception 'published cover media is invalid' using errcode='23514'; end if;
  select name into category_label from public.categories where id = d.category_id;
  insert into public.publications(
    post_id,draft_version,slug,title,summary,category_id,category_name,tags,document,
    cover_media_id,original_created_at,source_url,comments_enabled,comments_visible
  ) values (
    p.id,d.version,p.slug,d.title,d.summary,d.category_id,category_label,d.tags,p_published_document,
    p_published_cover_media_id,d.original_created_at,d.source_url,p.comments_enabled,p.comments_visible
  ) returning id into pub_id;
  update public.posts set status='published', current_publication_id=pub_id where id=p.id;
  update public.deployments set status='superseded',completed_at=now(),error_message='Superseded by a newer public snapshot.'
  where status in ('requested','building');
  insert into public.deployments(id,publication_id,kind,manifest)
  values(dep_id,pub_id,'publish',public.build_public_manifest(dep_id));
  insert into public.draft_versions(post_id,version,snapshot,reason)
  values(d.post_id,d.version,to_jsonb(d),'publish') on conflict(post_id,version) do update set reason='publish';
  return query select pub_id, dep_id;
end;
$$;

create or replace function public.unpublish_post(p_post_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare dep_id uuid := gen_random_uuid();
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dorami-publication'));
  update public.posts set status='unpublished', current_publication_id=null where id=p_post_id and deleted_at is null;
  if not found then raise exception 'post not found' using errcode='P0002'; end if;
  update public.deployments set status='superseded',completed_at=now(),error_message='Superseded by a newer public snapshot.'
  where status in ('requested','building');
  insert into public.deployments(id,kind,manifest)
  values(dep_id,'unpublish',public.build_public_manifest(dep_id));
  return dep_id;
end;
$$;

create or replace function public.restore_draft_version(p_post_id uuid, p_version bigint)
returns public.drafts language plpgsql security definer set search_path = '' as $$
declare source jsonb; declare current_version bigint; declare restored public.drafts;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode = '42501'; end if;
  select snapshot into source from public.draft_versions where post_id=p_post_id and version=p_version;
  if source is null then raise exception 'draft version not found' using errcode='P0002'; end if;
  select version into current_version from public.drafts where post_id=p_post_id for update;
  update public.drafts set
    title=source->>'title', summary=source->>'summary', category_id=(source->>'category_id')::uuid,
    tags=array(select jsonb_array_elements_text(source->'tags')), document=source->'document',
    cover_media_id=(source->>'cover_media_id')::uuid,
    original_created_at=(source->>'original_created_at')::timestamptz,
    source_url=source->>'source_url', version=current_version+1, updated_at=now()
  where post_id=p_post_id returning * into restored;
  insert into public.draft_versions(post_id,version,snapshot,reason)
  values(p_post_id,restored.version,to_jsonb(restored),'restore');
  return restored;
end;
$$;

create or replace function public.analytics_summary(p_from date, p_to date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 366 then
    raise exception 'invalid analytics date range' using errcode='22023';
  end if;
  select jsonb_build_object(
    'timezone','Asia/Seoul','metric','page_views','from',p_from,'to',p_to,
    'total',count(*),
    'daily',coalesce((select jsonb_agg(jsonb_build_object('day',x.report_day,'views',x.view_count) order by x.report_day) from (
      select (v.occurred_at at time zone 'Asia/Seoul')::date as report_day,count(*) as view_count
      from public.view_events v
      where (v.occurred_at at time zone 'Asia/Seoul')::date between p_from and p_to
      group by 1
    ) x),'[]'::jsonb),
    'posts',coalesce((select jsonb_agg(jsonb_build_object('postId',x.post_id,'title',x.title,'views',x.view_count) order by x.view_count desc) from (
      select v.post_id,max(pub.title) as title,count(*) as view_count
      from public.view_events v
      join public.posts ps on ps.id=v.post_id
      left join public.publications pub on pub.id=ps.current_publication_id
      where (v.occurred_at at time zone 'Asia/Seoul')::date between p_from and p_to
      group by v.post_id
    ) x),'[]'::jsonb)
  ) into result
  from public.view_events v
  where (v.occurred_at at time zone 'Asia/Seoul')::date between p_from and p_to;
  return result;
end;
$$;

create or replace function public.export_backup()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'format','dorami-backup','schemaVersion',1,'exportedAt',now(),
    'categories',coalesce((select jsonb_agg(to_jsonb(t)) from public.categories t),'[]'::jsonb),
    'posts',coalesce((select jsonb_agg(to_jsonb(t)) from public.posts t),'[]'::jsonb),
    'drafts',coalesce((select jsonb_agg(to_jsonb(t)) from public.drafts t),'[]'::jsonb),
    'draftVersions',coalesce((select jsonb_agg(to_jsonb(t)) from public.draft_versions t),'[]'::jsonb),
    'publications',coalesce((select jsonb_agg(to_jsonb(t)) from public.publications t),'[]'::jsonb),
    'slugAliases',coalesce((select jsonb_agg(to_jsonb(t)) from public.slug_aliases t),'[]'::jsonb),
    'templates',coalesce((select jsonb_agg(to_jsonb(t)) from public.templates t),'[]'::jsonb),
    'mediaAssets',coalesce((select jsonb_agg(to_jsonb(t)) from public.media_assets t),'[]'::jsonb),
    'comments',coalesce((select jsonb_agg(to_jsonb(t)) from public.comments t),'[]'::jsonb)
    ,'aboutDraft',(select to_jsonb(t) from public.about_draft t where id=1)
    ,'aboutVersions',coalesce((select jsonb_agg(to_jsonb(t)) from public.about_versions t),'[]'::jsonb)
    ,'aboutPublications',coalesce((select jsonb_agg(to_jsonb(t)) from public.about_publications t),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_draft_post(text,uuid) from public;
revoke all on function public.save_draft(uuid,bigint,text,text,uuid,text[],jsonb,uuid,timestamptz,text) from public;
revoke all on function public.publish_post(uuid,bigint,jsonb,uuid) from public;
revoke all on function public.unpublish_post(uuid) from public;
revoke all on function public.restore_draft_version(uuid,bigint) from public;
revoke all on function public.analytics_summary(date,date) from public;
revoke all on function public.export_backup() from public;

grant execute on function public.create_draft_post(text,uuid) to authenticated;
grant execute on function public.save_draft(uuid,bigint,text,text,uuid,text[],jsonb,uuid,timestamptz,text) to authenticated;
grant execute on function public.publish_post(uuid,bigint,jsonb,uuid) to authenticated;
grant execute on function public.unpublish_post(uuid) to authenticated;
grant execute on function public.restore_draft_version(uuid,bigint) to authenticated;
grant execute on function public.analytics_summary(date,date) to authenticated;
grant execute on function public.export_backup() to authenticated;

alter table public.owner_accounts enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.drafts enable row level security;
alter table public.draft_versions enable row level security;
alter table public.publications enable row level security;
alter table public.slug_aliases enable row level security;
alter table public.templates enable row level security;
alter table public.media_assets enable row level security;
alter table public.comments enable row level security;
alter table public.view_events enable row level security;
alter table public.deployments enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_warnings enable row level security;

create policy owner_select_self on public.owner_accounts for select to authenticated using (user_id=auth.uid() and public.is_owner());

do $$
declare table_name text;
begin
  foreach table_name in array array['categories','posts','slug_aliases','templates','media_assets','comments','import_jobs','import_warnings']
  loop
    execute format('create policy owner_all on public.%I for all to authenticated using (public.is_owner()) with check (public.is_owner())',table_name);
  end loop;
end $$;

create policy owner_read_drafts on public.drafts for select to authenticated using (public.is_owner());
create policy owner_read_draft_versions on public.draft_versions for select to authenticated using (public.is_owner());
create policy owner_read_publications on public.publications for select to authenticated using (public.is_owner());
create policy owner_read_deployments on public.deployments for select to authenticated using (public.is_owner());
create policy owner_stats_only on public.view_events for select to authenticated using (public.is_owner());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('draft-media','draft-media',false,20971520,array['image/jpeg','image/png','image/webp','image/gif']),
('published-media','published-media',true,20971520,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy owner_draft_media on storage.objects for all to authenticated
using (bucket_id='draft-media' and public.is_owner())
with check (bucket_id='draft-media' and public.is_owner());
create policy owner_published_media_write on storage.objects for all to authenticated
using (bucket_id='published-media' and public.is_owner())
with check (bucket_id='published-media' and public.is_owner());
create policy public_published_media_read on storage.objects for select to anon
using (bucket_id='published-media');

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;
grant select,insert,update,delete on public.categories,public.posts,public.slug_aliases,public.templates,
 public.media_assets,public.comments,public.import_jobs,public.import_warnings to authenticated;
grant select on public.owner_accounts,public.drafts,public.draft_versions,public.publications,
 public.deployments,public.view_events to authenticated;
