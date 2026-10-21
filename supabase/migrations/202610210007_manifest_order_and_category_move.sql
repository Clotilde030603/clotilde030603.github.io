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
    select pub.*,p.comments_enabled as live_comments_enabled,p.comments_visible as live_comments_visible,
      p.pinned as live_pinned,p.position as live_position
    from public.posts p join public.publications pub on pub.id=p.current_publication_id
    where p.status='published' and p.deleted_at is null
  )
  select jsonb_build_object(
    'schemaVersion',1,'deploymentId',p_deployment_id,'generatedAt',now(),
    'categories',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'slug',slug,'parentId',parent_id,'position',position) order by position,name) from category_rows),'[]'::jsonb),
    'posts',coalesce((select jsonb_agg(jsonb_build_object(
      'id',post_id,'slug',slug,'title',title,'summary',summary,'categoryId',category_id,'tags',tags,
      'document',document,'publishedAt',published_at,'updatedAt',published_at,'pinned',live_pinned,'position',live_position,
      'commentsEnabled',live_comments_enabled,'commentsVisible',live_comments_visible,'sourceUrl',source_url
    ) order by live_pinned desc,live_position,published_at desc) from post_rows),'[]'::jsonb),
    'slugAliases',coalesce((select jsonb_agg(jsonb_build_object('slug',a.slug,'postId',a.post_id,'targetSlug',pub.slug) order by a.slug)
      from public.slug_aliases a join public.posts p on p.id=a.post_id join public.publications pub on pub.id=p.current_publication_id
      where p.status='published' and p.deleted_at is null and a.slug<>pub.slug),'[]'::jsonb),
    'about',(select ap.document from public.site_settings s left join public.about_publications ap on ap.id=s.current_about_publication_id where s.id=1)
  );
$$;

revoke all on function public.build_public_manifest(uuid) from public;
grant execute on function public.build_public_manifest(uuid) to service_role;

create or replace function public.move_category(p_category_id uuid,p_new_parent_id uuid default null)
returns public.categories language plpgsql security definer set search_path='' as $$
declare old_parent uuid;declare moved public.categories;declare target_position integer;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_category_id is null or p_category_id=p_new_parent_id then raise exception 'invalid category destination' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtext('dorami-category-tree'));
  select parent_id into old_parent from public.categories where id=p_category_id for update;
  if not found then raise exception 'category not found' using errcode='P0002'; end if;
  if p_new_parent_id is not null then
    perform 1 from public.categories where id=p_new_parent_id for update;
    if not found then raise exception 'parent category not found' using errcode='P0002'; end if;
  end if;
  if old_parent is not distinct from p_new_parent_id then select * into moved from public.categories where id=p_category_id;return moved;end if;
  select count(*) into target_position from public.categories where parent_id is not distinct from p_new_parent_id and id<>p_category_id;
  update public.categories set parent_id=p_new_parent_id,position=target_position where id=p_category_id returning * into moved;
  with ordered as (
    select id,row_number() over(order by position,id)-1 as next_position from public.categories
    where parent_id is not distinct from old_parent and id<>p_category_id
  ) update public.categories c set position=ordered.next_position from ordered where c.id=ordered.id;
  with ordered as (
    select id,row_number() over(order by case when id=p_category_id then 1 else 0 end,position,id)-1 as next_position from public.categories
    where parent_id is not distinct from p_new_parent_id
  ) update public.categories c set position=ordered.next_position from ordered where c.id=ordered.id;
  select * into moved from public.categories where id=p_category_id;
  return moved;
end;
$$;

revoke all on function public.move_category(uuid,uuid) from public;
grant execute on function public.move_category(uuid,uuid) to authenticated;
