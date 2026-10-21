create or replace function public.delete_category(p_category_id uuid, p_move_to_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare moved_posts integer; declare moved_children integer; declare affected_publications integer;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_category_id is null or p_category_id=p_move_to_id then raise exception 'invalid category destination' using errcode='22023'; end if;
  perform 1 from public.categories where id=p_category_id for update;
  if not found then raise exception 'category not found' using errcode='P0002'; end if;
  if p_move_to_id is not null and not exists(select 1 from public.categories where id=p_move_to_id) then
    raise exception 'destination category not found' using errcode='P0002';
  end if;
  if p_move_to_id is not null and exists(
    with recursive descendants(id) as (
      select id from public.categories where parent_id=p_category_id
      union all select c.id from public.categories c join descendants d on c.parent_id=d.id
    ) select 1 from descendants where id=p_move_to_id
  ) then raise exception 'destination cannot be a descendant' using errcode='23514'; end if;
  select count(*) into affected_publications from public.posts p join public.publications pub on pub.id=p.current_publication_id
  where p.status='published' and pub.category_id=p_category_id;
  update public.drafts set category_id=p_move_to_id where category_id=p_category_id;
  get diagnostics moved_posts=row_count;
  update public.categories set parent_id=p_move_to_id where parent_id=p_category_id;
  get diagnostics moved_children=row_count;
  delete from public.categories where id=p_category_id;
  return jsonb_build_object('movedDrafts',moved_posts,'movedChildren',moved_children,
    'affectedPublications',affected_publications,'requiresPublicationRefresh',affected_publications>0);
end;
$$;

revoke all on function public.delete_category(uuid,uuid) from public;
grant execute on function public.delete_category(uuid,uuid) to authenticated;
