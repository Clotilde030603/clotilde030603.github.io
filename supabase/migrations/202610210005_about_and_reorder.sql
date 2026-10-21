create table public.about_draft (
  id smallint primary key default 1 check(id=1),
  document jsonb not null default '{"schemaVersion":1,"content":{"type":"doc","content":[]}}'::jsonb,
  version bigint not null default 1 check(version>0),
  updated_at timestamptz not null default now(),
  check ((document->>'schemaVersion')::integer=1 and jsonb_typeof(document->'content')='object')
);

create table public.about_versions (
  id uuid primary key default gen_random_uuid(),
  version bigint not null unique,
  document jsonb not null,
  reason text not null check(reason in ('save','publish','restore')),
  created_at timestamptz not null default now()
);

create table public.about_publications (
  id uuid primary key default gen_random_uuid(),
  draft_version bigint not null unique,
  document jsonb not null,
  published_at timestamptz not null default now()
);

create table public.site_settings (
  id smallint primary key default 1 check(id=1),
  current_about_publication_id uuid references public.about_publications(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.about_draft(id) values(1);
insert into public.about_versions(version,document,reason)
select version,document,'save' from public.about_draft where id=1;
insert into public.site_settings(id) values(1);

alter table public.about_draft enable row level security;
alter table public.about_versions enable row level security;
alter table public.about_publications enable row level security;
alter table public.site_settings enable row level security;
create policy owner_read_about_draft on public.about_draft for select to authenticated using(public.is_owner());
create policy owner_read_about_versions on public.about_versions for select to authenticated using(public.is_owner());
create policy owner_read_about_publications on public.about_publications for select to authenticated using(public.is_owner());
create policy owner_read_site_settings on public.site_settings for select to authenticated using(public.is_owner());
revoke all on public.about_draft,public.about_versions,public.about_publications,public.site_settings from anon,authenticated;
grant select on public.about_draft,public.about_versions,public.about_publications,public.site_settings to authenticated;

create or replace function public.build_public_manifest(p_deployment_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with recursive published_categories(id) as (
    select distinct pub.category_id from public.posts p join public.publications pub on pub.id=p.current_publication_id
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
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'parentId',parent_id,'position',position) order by position,name) from category_rows),'[]'::jsonb),
    'posts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',post_id,'slug',slug,'title',title,'summary',summary,'categoryId',category_id,'tags',tags,
      'document',document,'publishedAt',published_at,'updatedAt',published_at,
      'commentsEnabled',live_comments_enabled,'commentsVisible',live_comments_visible,'sourceUrl',source_url
    ) order by published_at desc) from post_rows),'[]'::jsonb),
    'slugAliases',coalesce((select jsonb_agg(jsonb_build_object('slug',a.slug,'postId',a.post_id,'targetSlug',pub.slug) order by a.slug)
      from public.slug_aliases a join public.posts p on p.id=a.post_id join public.publications pub on pub.id=p.current_publication_id
      where p.status='published' and p.deleted_at is null and a.slug<>pub.slug),'[]'::jsonb),
    'about',(select ap.document from public.site_settings s left join public.about_publications ap on ap.id=s.current_about_publication_id where s.id=1)
  );
$$;

revoke all on function public.build_public_manifest(uuid) from public;
grant execute on function public.build_public_manifest(uuid) to service_role;

create or replace function public.save_about(p_expected_version bigint,p_document jsonb)
returns public.about_draft language plpgsql security definer set search_path='' as $$
declare saved public.about_draft;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if (p_document->>'schemaVersion')::integer<>1 or jsonb_typeof(p_document->'content')<>'object' then
    raise exception 'invalid about document' using errcode='22023';
  end if;
  update public.about_draft set document=p_document,version=version+1,updated_at=now()
  where id=1 and version=p_expected_version returning * into saved;
  if saved.id is null then raise exception 'about version conflict' using errcode='40001'; end if;
  insert into public.about_versions(version,document,reason) values(saved.version,saved.document,'save');
  return saved;
end;
$$;

create or replace function public.publish_about(p_expected_version bigint,p_published_document jsonb)
returns table(publication_id uuid,deployment_id uuid)
language plpgsql security definer set search_path='' as $$
declare d public.about_draft; declare pub_id uuid:=gen_random_uuid(); declare dep_id uuid:=gen_random_uuid();
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtext('dorami-publication'));
  select * into d from public.about_draft where id=1 for update;
  if d.version<>p_expected_version then raise exception 'about version conflict' using errcode='40001'; end if;
  if (p_published_document->>'schemaVersion')::integer<>1 or jsonb_typeof(p_published_document->'content')<>'object'
    or p_published_document::text like '%import-asset:%' or p_published_document::text like '%draft-media%' then
    raise exception 'About contains unresolved media' using errcode='23514';
  end if;
  insert into public.about_publications(id,draft_version,document) values(pub_id,d.version,p_published_document);
  update public.site_settings set current_about_publication_id=pub_id,updated_at=now() where id=1;
  update public.deployments set status='superseded',completed_at=now(),error_message='Superseded by a newer public snapshot.' where status in('requested','building');
  insert into public.deployments(id,kind,manifest) values(dep_id,'publish',public.build_public_manifest(dep_id));
  insert into public.about_versions(version,document,reason) values(d.version,d.document,'publish')
  on conflict(version) do update set reason='publish';
  return query select pub_id,dep_id;
end;
$$;

create or replace function public.reorder_categories(p_parent_id uuid,p_category_ids uuid[])
returns integer language plpgsql security definer set search_path='' as $$
declare expected integer; declare supplied integer:=coalesce(cardinality(p_category_ids),0);
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_parent_id is not null and not exists(select 1 from public.categories where id=p_parent_id) then raise exception 'parent category not found' using errcode='P0002'; end if;
  select count(*) into expected from public.categories where parent_id is not distinct from p_parent_id;
  if supplied<>expected or (select count(distinct id) from unnest(coalesce(p_category_ids,'{}'::uuid[])) id)<>supplied
    or exists(select 1 from unnest(coalesce(p_category_ids,'{}'::uuid[])) id where not exists(
      select 1 from public.categories c where c.id=id and c.parent_id is not distinct from p_parent_id
    )) then raise exception 'category order must contain every sibling exactly once' using errcode='22023'; end if;
  update public.categories c set position=ordered.ordinality-1
  from unnest(coalesce(p_category_ids,'{}'::uuid[])) with ordinality ordered(id,ordinality) where c.id=ordered.id;
  return expected;
end;
$$;

create or replace function public.reorder_posts(p_category_id uuid,p_post_ids uuid[])
returns integer language plpgsql security definer set search_path='' as $$
declare expected integer; declare supplied integer:=coalesce(cardinality(p_post_ids),0);
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_category_id is not null and not exists(select 1 from public.categories where id=p_category_id) then raise exception 'category not found' using errcode='P0002'; end if;
  select count(*) into expected from public.posts p join public.drafts d on d.post_id=p.id
  where d.category_id is not distinct from p_category_id and p.deleted_at is null and p.status<>'trashed';
  if supplied<>expected or (select count(distinct id) from unnest(coalesce(p_post_ids,'{}'::uuid[])) id)<>supplied
    or exists(select 1 from unnest(coalesce(p_post_ids,'{}'::uuid[])) id where not exists(
      select 1 from public.posts p join public.drafts d on d.post_id=p.id
      where p.id=id and d.category_id is not distinct from p_category_id and p.deleted_at is null and p.status<>'trashed'
    )) then raise exception 'post order must contain every active post in the category exactly once' using errcode='22023'; end if;
  update public.posts p set position=ordered.ordinality-1
  from unnest(coalesce(p_post_ids,'{}'::uuid[])) with ordinality ordered(id,ordinality) where p.id=ordered.id;
  return expected;
end;
$$;

revoke all on function public.save_about(bigint,jsonb),public.publish_about(bigint,jsonb),public.reorder_categories(uuid,uuid[]),public.reorder_posts(uuid,uuid[]) from public;
grant execute on function public.save_about(bigint,jsonb),public.publish_about(bigint,jsonb),public.reorder_categories(uuid,uuid[]),public.reorder_posts(uuid,uuid[]) to authenticated;
