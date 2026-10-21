create extension if not exists pg_cron with schema extensions;

create or replace function public.purge_expired_view_events()
returns bigint language plpgsql security definer set search_path = '' as $$
declare removed bigint;
begin
  delete from public.view_events where occurred_at < now() - interval '30 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_expired_view_events() from public;
grant execute on function public.purge_expired_view_events() to service_role;

select cron.schedule(
  'dorami-purge-view-events',
  '17 18 * * *',
  $$select public.purge_expired_view_events()$$
)
where not exists (select 1 from cron.job where jobname='dorami-purge-view-events');
