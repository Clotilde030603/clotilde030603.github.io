-- Keep bounded public comment reads indexed as approved comments accumulate.
create index if not exists comments_public_post_created_idx
  on public.comments(post_id, created_at desc)
  where status = 'published';
