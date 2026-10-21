create or replace function public.document_references_media(p_document jsonb,p_media_id uuid)
returns boolean language sql immutable set search_path='' as $$
  select coalesce(exists(
    select 1 from jsonb_path_query(p_document,'strict $.**.mediaId') value
    where value#>>'{}'=p_media_id::text
  ),false);
$$;

revoke all on function public.document_references_media(jsonb,uuid) from public;
grant execute on function public.document_references_media(jsonb,uuid) to authenticated,service_role;

create or replace function public.replace_private_media(p_old_media_id uuid,p_new_media_id uuid,p_updates jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare old_asset public.media_assets;declare new_asset public.media_assets;declare expected integer;declare supplied integer;declare item jsonb;declare d public.drafts;declare about_needed boolean;declare about_version bigint;declare template_expected integer;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_old_media_id=p_new_media_id then raise exception 'replacement media must have a new identity' using errcode='22023'; end if;
  select * into old_asset from public.media_assets where id=p_old_media_id;
  select * into new_asset from public.media_assets where id=p_new_media_id;
  if old_asset.id is null or new_asset.id is null then raise exception 'media not found' using errcode='P0002'; end if;
  if new_asset.visibility<>'private' or new_asset.bucket_id<>'draft-media' then raise exception 'replacement must be a private draft asset' using errcode='23514'; end if;

  select count(*) into expected from public.drafts where cover_media_id=p_old_media_id or public.document_references_media(document,p_old_media_id);
  supplied=coalesce(jsonb_array_length(coalesce(p_updates->'drafts','[]'::jsonb)),0);
  if supplied<>expected then raise exception 'draft replacement set is incomplete' using errcode='22023'; end if;
  for item in select * from jsonb_array_elements(coalesce(p_updates->'drafts','[]'::jsonb)) loop
    select * into d from public.drafts where post_id=(item->>'postId')::uuid for update;
    if d.post_id is null or d.version<>(item->>'expectedVersion')::bigint
      or not(d.cover_media_id=p_old_media_id or public.document_references_media(d.document,p_old_media_id))
      or public.document_references_media(item->'document',p_old_media_id) then
      raise exception 'draft media replacement conflict' using errcode='40001';
    end if;
    update public.drafts set document=item->'document',cover_media_id=case when cover_media_id=p_old_media_id then p_new_media_id else cover_media_id end,
      version=version+1,updated_at=now() where post_id=d.post_id returning * into d;
    insert into public.draft_versions(post_id,version,snapshot,reason) values(d.post_id,d.version,to_jsonb(d),'save');
  end loop;

  select public.document_references_media(document,p_old_media_id) into about_needed from public.about_draft where id=1;
  if about_needed<>coalesce((p_updates->'about') is not null,false) then raise exception 'About replacement set is incomplete' using errcode='22023'; end if;
  if about_needed then
    select version into about_version from public.about_draft where id=1 for update;
    if about_version<>(p_updates->'about'->>'expectedVersion')::bigint
      or public.document_references_media(p_updates->'about'->'document',p_old_media_id) then raise exception 'About media replacement conflict' using errcode='40001'; end if;
    update public.about_draft set document=p_updates->'about'->'document',version=version+1,updated_at=now() where id=1;
    insert into public.about_versions(version,document,reason) select version,document,'save' from public.about_draft where id=1;
  end if;

  select count(*) into template_expected from public.templates where public.document_references_media(document,p_old_media_id);
  if coalesce(jsonb_array_length(coalesce(p_updates->'templates','[]'::jsonb)),0)<>template_expected then raise exception 'template replacement set is incomplete' using errcode='22023'; end if;
  for item in select * from jsonb_array_elements(coalesce(p_updates->'templates','[]'::jsonb)) loop
    update public.templates set document=item->'document',updated_at=now()
    where id=(item->>'id')::uuid and public.document_references_media(document,p_old_media_id);
    if not found or public.document_references_media(item->'document',p_old_media_id) then raise exception 'template media replacement conflict' using errcode='40001'; end if;
  end loop;
  return jsonb_build_object('drafts',expected,'about',about_needed,'templates',template_expected,'oldMediaId',p_old_media_id,'newMediaId',p_new_media_id);
end;
$$;

create or replace function public.document_uses_only_private_media(p_document jsonb)
returns boolean language sql stable security definer set search_path='' as $$
  select not exists(
    select 1 from jsonb_path_query(p_document,'strict $.**.mediaId') value
    where not exists(select 1 from public.media_assets m where m.id::text=value#>>'{}' and m.bucket_id='draft-media' and m.visibility='private')
  ) and p_document::text not like '%/object/public/%';
$$;

revoke all on function public.document_uses_only_private_media(jsonb) from public;
grant execute on function public.document_uses_only_private_media(jsonb) to authenticated,service_role;

create or replace function public.restore_publication_as_draft(p_post_id uuid,p_publication_id uuid,p_private_document jsonb,p_private_cover_media_id uuid default null)
returns public.drafts language plpgsql security definer set search_path='' as $$
declare pub public.publications;declare restored public.drafts;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select * into pub from public.publications where id=p_publication_id and post_id=p_post_id;
  if pub.id is null then raise exception 'publication not found for post' using errcode='P0002'; end if;
  if not public.document_uses_only_private_media(p_private_document) then raise exception 'restored document must use private media only' using errcode='23514'; end if;
  if p_private_cover_media_id is not null and not exists(select 1 from public.media_assets where id=p_private_cover_media_id and bucket_id='draft-media' and visibility='private') then raise exception 'restored cover must be private' using errcode='23514'; end if;
  perform 1 from public.drafts where post_id=p_post_id for update;
  update public.drafts set title=pub.title,summary=pub.summary,category_id=pub.category_id,tags=pub.tags,document=p_private_document,
    cover_media_id=p_private_cover_media_id,original_created_at=pub.original_created_at,source_url=pub.source_url,version=version+1,updated_at=now()
  where post_id=p_post_id returning * into restored;
  if restored.post_id is null then raise exception 'draft not found' using errcode='P0002'; end if;
  insert into public.draft_versions(post_id,version,snapshot,reason) values(restored.post_id,restored.version,to_jsonb(restored),'restore');
  return restored;
end;
$$;

create or replace function public.restore_publication_to_draft(p_publication_id uuid,p_private_document jsonb,p_private_cover_media_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare pub public.publications;declare new_post_id uuid:=gen_random_uuid();declare new_slug text;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  select * into pub from public.publications where id=p_publication_id;
  if pub.id is null then raise exception 'publication not found' using errcode='P0002'; end if;
  if not public.document_uses_only_private_media(p_private_document) then raise exception 'restored document must use private media only' using errcode='23514'; end if;
  if p_private_cover_media_id is not null and not exists(select 1 from public.media_assets where id=p_private_cover_media_id and bucket_id='draft-media' and visibility='private') then raise exception 'restored cover must be private' using errcode='23514'; end if;
  new_slug='draft-'||replace(new_post_id::text,'-','');
  insert into public.posts(id,slug,status,comments_enabled,comments_visible) values(new_post_id,new_slug,'draft',pub.comments_enabled,pub.comments_visible);
  insert into public.drafts(post_id,title,summary,category_id,tags,document,cover_media_id,original_created_at,source_url,version)
  values(new_post_id,pub.title||' (복원본)',pub.summary,pub.category_id,pub.tags,p_private_document,p_private_cover_media_id,pub.original_created_at,pub.source_url,1);
  insert into public.draft_versions(post_id,version,snapshot,reason)
  select new_post_id,1,to_jsonb(d),'restore' from public.drafts d where d.post_id=new_post_id;
  return new_post_id;
end;
$$;

revoke all on function public.replace_private_media(uuid,uuid,jsonb),public.restore_publication_as_draft(uuid,uuid,jsonb,uuid),public.restore_publication_to_draft(uuid,jsonb,uuid) from public;
grant execute on function public.replace_private_media(uuid,uuid,jsonb),public.restore_publication_as_draft(uuid,uuid,jsonb,uuid),public.restore_publication_to_draft(uuid,jsonb,uuid) to authenticated;
