create or replace function public.restore_backup(p_backup jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb;
declare restored_posts integer := 0;
begin
  if not public.is_owner() then raise exception 'owner access required' using errcode='42501'; end if;
  if p_backup->>'format' <> 'dorami-backup' or (p_backup->>'schemaVersion')::integer <> 1 then
    raise exception 'unsupported backup format' using errcode='22023';
  end if;
  if exists(select 1 from public.posts) or exists(select 1 from public.categories) then
    raise exception 'restore target must be empty' using errcode='55000', hint='Use a new project or archive existing content first.';
  end if;

  for item in select * from jsonb_array_elements(coalesce(p_backup->'categories','[]'::jsonb)) loop
    insert into public.categories(id,name,slug,parent_id,position,created_at,updated_at)
    values((item->>'id')::uuid,item->>'name',item->>'slug',null,
      coalesce((item->>'position')::integer,0),
      coalesce((item->>'created_at')::timestamptz,now()),coalesce((item->>'updated_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'categories','[]'::jsonb)) loop
    if item->>'parent_id' is not null then
      update public.categories set parent_id=(item->>'parent_id')::uuid where id=(item->>'id')::uuid;
    end if;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'mediaAssets','[]'::jsonb)) loop
    insert into public.media_assets(id,bucket_id,object_path,visibility,mime_type,byte_size,alt_text,width,height,created_at)
    values((item->>'id')::uuid,item->>'bucket_id',item->>'object_path',(item->>'visibility')::public.media_visibility,
      item->>'mime_type',(item->>'byte_size')::bigint,coalesce(item->>'alt_text',''),
      (item->>'width')::integer,(item->>'height')::integer,coalesce((item->>'created_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'posts','[]'::jsonb)) loop
    insert into public.posts(id,slug,status,current_publication_id,comments_enabled,comments_visible,pinned,position,deleted_at,created_at,updated_at)
    values((item->>'id')::uuid,item->>'slug',
      case when item->>'status'='trashed' then 'trashed'::public.post_status else 'unpublished'::public.post_status end,
      null,coalesce((item->>'comments_enabled')::boolean,true),coalesce((item->>'comments_visible')::boolean,true),
      coalesce((item->>'pinned')::boolean,false),coalesce((item->>'position')::integer,0),
      (item->>'deleted_at')::timestamptz,coalesce((item->>'created_at')::timestamptz,now()),coalesce((item->>'updated_at')::timestamptz,now()));
    restored_posts := restored_posts + 1;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'drafts','[]'::jsonb)) loop
    insert into public.drafts(post_id,title,summary,category_id,tags,document,cover_media_id,original_created_at,source_url,version,updated_at)
    values((item->>'post_id')::uuid,item->>'title',coalesce(item->>'summary',''),(item->>'category_id')::uuid,
      array(select jsonb_array_elements_text(coalesce(item->'tags','[]'::jsonb))),item->'document',
      (item->>'cover_media_id')::uuid,(item->>'original_created_at')::timestamptz,item->>'source_url',
      (item->>'version')::bigint,coalesce((item->>'updated_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'draftVersions','[]'::jsonb)) loop
    insert into public.draft_versions(id,post_id,version,snapshot,reason,created_at)
    values((item->>'id')::uuid,(item->>'post_id')::uuid,(item->>'version')::bigint,item->'snapshot',
      coalesce(item->>'reason','restore'),coalesce((item->>'created_at')::timestamptz,now()))
    on conflict(post_id,version) do nothing;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'publications','[]'::jsonb)) loop
    insert into public.publications(id,post_id,draft_version,slug,title,summary,category_id,category_name,tags,document,
      cover_media_id,original_created_at,source_url,comments_enabled,comments_visible,published_at)
    values((item->>'id')::uuid,(item->>'post_id')::uuid,(item->>'draft_version')::bigint,item->>'slug',item->>'title',
      coalesce(item->>'summary',''),(item->>'category_id')::uuid,item->>'category_name',
      array(select jsonb_array_elements_text(coalesce(item->'tags','[]'::jsonb))),item->'document',
      (item->>'cover_media_id')::uuid,(item->>'original_created_at')::timestamptz,item->>'source_url',
      coalesce((item->>'comments_enabled')::boolean,true),coalesce((item->>'comments_visible')::boolean,true),
      coalesce((item->>'published_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'slugAliases','[]'::jsonb)) loop
    insert into public.slug_aliases(slug,post_id,created_at)
    values(item->>'slug',(item->>'post_id')::uuid,coalesce((item->>'created_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'templates','[]'::jsonb)) loop
    insert into public.templates(id,name,document,created_at,updated_at)
    values((item->>'id')::uuid,item->>'name',item->'document',coalesce((item->>'created_at')::timestamptz,now()),coalesce((item->>'updated_at')::timestamptz,now()));
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'comments','[]'::jsonb)) loop
    insert into public.comments(id,post_id,parent_id,nickname,body,website,status,created_at,updated_at,deleted_at)
    values((item->>'id')::uuid,(item->>'post_id')::uuid,null,item->>'nickname',item->>'body',item->>'website',
      (item->>'status')::public.comment_status,coalesce((item->>'created_at')::timestamptz,now()),
      coalesce((item->>'updated_at')::timestamptz,now()),(item->>'deleted_at')::timestamptz);
  end loop;
  for item in select * from jsonb_array_elements(coalesce(p_backup->'comments','[]'::jsonb)) loop
    if item->>'parent_id' is not null then
      update public.comments set parent_id=(item->>'parent_id')::uuid where id=(item->>'id')::uuid;
    end if;
  end loop;
  if p_backup->'aboutDraft' is not null then
    update public.about_draft set document=p_backup->'aboutDraft'->'document',
      version=coalesce((p_backup->'aboutDraft'->>'version')::bigint,1),updated_at=now() where id=1;
    delete from public.about_versions;
    for item in select * from jsonb_array_elements(coalesce(p_backup->'aboutVersions','[]'::jsonb)) loop
      insert into public.about_versions(id,version,document,reason,created_at)
      values((item->>'id')::uuid,(item->>'version')::bigint,item->'document',coalesce(item->>'reason','restore'),coalesce((item->>'created_at')::timestamptz,now()));
    end loop;
    for item in select * from jsonb_array_elements(coalesce(p_backup->'aboutPublications','[]'::jsonb)) loop
      insert into public.about_publications(id,draft_version,document,published_at)
      values((item->>'id')::uuid,(item->>'draft_version')::bigint,item->'document',coalesce((item->>'published_at')::timestamptz,now()));
    end loop;
    update public.site_settings set current_about_publication_id=null,updated_at=now() where id=1;
  end if;
  return jsonb_build_object('restoredPosts',restored_posts,'publicationState','unpublished');
end;
$$;

revoke all on function public.restore_backup(jsonb) from public;
grant execute on function public.restore_backup(jsonb) to authenticated;
