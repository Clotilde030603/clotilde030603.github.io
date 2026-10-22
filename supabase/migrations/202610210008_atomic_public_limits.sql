-- Keep public abuse limits inside one database transaction so concurrent edge
-- requests cannot all pass a separate count-before-insert check.
create or replace function public.submit_public_comment(
  p_post_id uuid,
  p_parent_id uuid,
  p_nickname text,
  p_body text,
  p_website text,
  p_submission_hash text
)
returns table(comment_id uuid, comment_status text, comment_created_at timestamptz, rate_limited boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted public.comments%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('comment:' || p_submission_hash, 0));

  if (select count(*) from public.comments
      where submission_hash = p_submission_hash
        and created_at >= now() - interval '10 minutes') >= 5 then
    return query select null::uuid, null::text, null::timestamptz, true;
    return;
  end if;

  insert into public.comments(post_id,parent_id,nickname,body,website,submission_hash,status)
  values(p_post_id,p_parent_id,p_nickname,p_body,p_website,p_submission_hash,'pending')
  returning * into inserted;

  return query select inserted.id, inserted.status::text, inserted.created_at, false;
end;
$$;

create or replace function public.record_public_view(
  p_post_id uuid,
  p_session_hash text,
  p_request_hash text,
  p_dedupe_bucket timestamptz
)
returns table(recorded boolean, rate_limited boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('view:' || p_request_hash, 0));

  if (select count(*) from public.view_events
      where request_hash = p_request_hash
        and occurred_at >= now() - interval '1 minute') >= 60 then
    return query select false, true;
    return;
  end if;

  insert into public.view_events(post_id,session_hash,request_hash,dedupe_bucket)
  values(p_post_id,p_session_hash,p_request_hash,p_dedupe_bucket)
  on conflict(post_id,session_hash,dedupe_bucket) do nothing;
  get diagnostics inserted_count = row_count;

  return query select inserted_count = 1, false;
end;
$$;

revoke all on function public.submit_public_comment(uuid,uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.record_public_view(uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.submit_public_comment(uuid,uuid,text,text,text,text) to service_role;
grant execute on function public.record_public_view(uuid,text,text,timestamptz) to service_role;

-- Published objects are immutable from browser sessions. Promotion and cleanup
-- use the service role in protected Edge Functions and bypass RLS.
drop policy if exists owner_published_media_write on storage.objects;
