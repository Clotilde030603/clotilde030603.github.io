begin;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;
select plan(43);

insert into auth.users(id,email) values ('11111111-1111-4111-8111-111111111111','owner@example.test');
insert into public.owner_accounts(user_id) values ('11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;

select ok(public.is_owner(), 'the provisioned auth UUID is the owner');
create temporary table test_state(post_id uuid, publication_id uuid, deployment_id uuid, first_deployment_id uuid);
insert into test_state(post_id) values(public.create_draft_post('초안',null));
select is((select status::text from public.posts where id=(select post_id from test_state)),'draft','new posts start as drafts');
select is((select version from public.drafts where post_id=(select post_id from test_state)),1::bigint,'new draft begins at version 1');

update public.posts set slug='safe-public-slug' where id=(select post_id from test_state);
update public.posts set pinned=true,position=7 where id=(select post_id from test_state);
select is((select version from public.save_draft(
  (select post_id from test_state),1,'공개 전 제목','요약',null,array['보안'],
  '{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph"}]}}'::jsonb,null,null,null
)),2::bigint,'save increments the optimistic version');

select throws_ok(format(
  'select public.save_draft(%L,1,%L,%L,null,array[]::text[],%L::jsonb,null,null,null)',
  (select post_id from test_state),'stale','', '{"schemaVersion":1,"content":{"type":"doc","content":[]}}'
),'40001','draft version conflict','stale saves are rejected');

with published as (
  select * from public.publish_post((select post_id from test_state),2,
    '{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph"}]}}'::jsonb,null)
) update test_state set publication_id=published.publication_id,deployment_id=published.deployment_id,first_deployment_id=published.deployment_id from published;
select is((select status::text from public.posts where id=(select post_id from test_state)),'published','explicit publish changes public state');
select is((select title from public.publications where id=(select publication_id from test_state)),'공개 전 제목','publication stores an immutable snapshot');
select is((select manifest->>'deploymentId' from public.deployments where id=(select deployment_id from test_state)),(select deployment_id::text from test_state),'deployment freezes a matching manifest');
select is((select (manifest->'posts'->0->>'pinned')::boolean from public.deployments where id=(select deployment_id from test_state)),true,'public manifest carries the live pinned flag');
select is((select (manifest->'posts'->0->>'position')::integer from public.deployments where id=(select deployment_id from test_state)),7,'public manifest carries the live curated position');
select ok((select manifest->'about'='null'::jsonb from public.deployments where id=(select deployment_id from test_state)),'private About draft is absent before explicit publish');
select is((select version from public.save_about(1,'{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"공개 소개"}]}]}}'::jsonb)),2::bigint,'About save increments its private version');
create temporary table about_state(publication_id uuid,deployment_id uuid);
insert into about_state select * from public.publish_about(2,'{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"공개 소개"}]}]}}'::jsonb);
select is((select manifest->'about'->'content'->'content'->0->'content'->0->>'text' from public.deployments where id=(select deployment_id from about_state)),'공개 소개','explicit About publish enters the public manifest');
select is((select version from public.save_about(2,'{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"비공개 수정"}]}]}}'::jsonb)),3::bigint,'published About keeps a separate editable draft');
select is((select document->'content'->'content'->0->'content'->0->>'text' from public.about_publications where id=(select current_about_publication_id from public.site_settings where id=1)),'공개 소개','saving About does not mutate its public version');
select throws_ok($$select public.save_about(2,'{"schemaVersion":1,"content":{"type":"doc","content":[]}}'::jsonb)$$,'40001','about version conflict','stale About saves are rejected');

select is((select version from public.save_draft(
  (select post_id from test_state),2,'수정 중 제목','새 요약',null,array['보안'],
  '{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"수정"}]}]}}'::jsonb,null,null,null
)),3::bigint,'published posts retain a separately saved working draft');
select is((select title from public.publications where id=(select publication_id from test_state)),'공개 전 제목','saving a draft does not mutate the live publication');
update public.posts set slug='new-safe-public-slug' where id=(select post_id from test_state);
with republished as (
  select * from public.publish_post((select post_id from test_state),3,
    '{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"수정"}]}]}}'::jsonb,null)
) update test_state set deployment_id=republished.deployment_id from republished;
select ok(exists(select 1 from public.slug_aliases where slug='safe-public-slug' and post_id=(select post_id from test_state)),'slug changes preserve the former address');
select is((select manifest->'slugAliases'->0->>'targetSlug' from public.deployments where id=(select deployment_id from test_state)),'new-safe-public-slug','public manifest maps aliases to the current published slug');
select is((select status::text from public.deployments where id=(select first_deployment_id from test_state)),'superseded','a newer snapshot supersedes an older pending deployment');
select is((select title from public.restore_publication_as_draft((select post_id from test_state),(select publication_id from test_state),(select document from public.publications where id=(select publication_id from test_state)),null)),'공개 전 제목','an immutable publication can be restored as a new private draft');
select ok((select current_publication_id<>(select publication_id from test_state) from public.posts where id=(select post_id from test_state)),'restoring a publication never changes the live publication pointer');
create temporary table restored_copy(post_id uuid);
insert into restored_copy values(public.restore_publication_to_draft((select publication_id from test_state),(select document from public.publications where id=(select publication_id from test_state)),null));
select isnt((select post_id from restored_copy),(select post_id from test_state),'publication restore can create a distinct private draft post');
select is((select status::text from public.posts where id=(select post_id from restored_copy)),'draft','restored publication copy is never automatically published');

insert into public.categories(id,name,slug) values
('22222222-2222-4222-8222-222222222221','상위','parent'),
('22222222-2222-4222-8222-222222222222','하위','child');
update public.categories set parent_id='22222222-2222-4222-8222-222222222221' where id='22222222-2222-4222-8222-222222222222';
select throws_ok($$update public.categories set parent_id='22222222-2222-4222-8222-222222222222' where id='22222222-2222-4222-8222-222222222221'$$,
  '23514','category cycle is not allowed','category cycles are rejected');

insert into public.categories(id,name,slug) values
('33333333-3333-4333-8333-333333333331','삭제 대상','delete-source'),
('33333333-3333-4333-8333-333333333332','이동 대상','move-target'),
('33333333-3333-4333-8333-333333333333','이동할 하위','move-child');
update public.categories set parent_id='33333333-3333-4333-8333-333333333331' where id='33333333-3333-4333-8333-333333333333';
select ok((select version from public.save_draft(
  (select post_id from test_state),4,'수정 중 제목','새 요약','33333333-3333-4333-8333-333333333331',array['보안'],
  '{"schemaVersion":1,"content":{"type":"doc","content":[{"type":"paragraph"}]}}'::jsonb,null,null,null
))=5,'category assignment is saved through the versioned draft RPC');
select lives_ok($$select public.delete_category('33333333-3333-4333-8333-333333333331','33333333-3333-4333-8333-333333333332')$$,'category deletion safely reassigns dependent records');
select ok(
  (select category_id='33333333-3333-4333-8333-333333333332' from public.drafts where post_id=(select post_id from test_state))
  and (select parent_id='33333333-3333-4333-8333-333333333332' from public.categories where id='33333333-3333-4333-8333-333333333333'),
  'drafts and child categories move to the selected destination'
);

insert into public.categories(id,name,slug) values('44444444-4444-4444-8444-444444444440','정렬 부모','order-parent');
insert into public.categories(id,name,slug,parent_id) values
('44444444-4444-4444-8444-444444444441','첫째','order-one','44444444-4444-4444-8444-444444444440'),
('44444444-4444-4444-8444-444444444442','둘째','order-two','44444444-4444-4444-8444-444444444440');
select is(public.reorder_categories('44444444-4444-4444-8444-444444444440',array['44444444-4444-4444-8444-444444444442','44444444-4444-4444-8444-444444444441']::uuid[]),2,'category reorder updates every sibling transactionally');
select ok((select position=0 from public.categories where id='44444444-4444-4444-8444-444444444442') and (select position=1 from public.categories where id='44444444-4444-4444-8444-444444444441'),'category positions follow the submitted order');
insert into public.categories(id,name,slug) values('55555555-5555-4555-8555-555555555550','새 부모','new-parent');
select is((public.move_category('44444444-4444-4444-8444-444444444442','55555555-5555-4555-8555-555555555550')).parent_id,'55555555-5555-4555-8555-555555555550'::uuid,'category move changes the parent transactionally');
select is((select position from public.categories where id='44444444-4444-4444-8444-444444444442'),0,'moved category receives a safe normalized position');
create temporary table reorder_posts(id uuid);
insert into reorder_posts values(public.create_draft_post('순서 글 1','44444444-4444-4444-8444-444444444440')),(public.create_draft_post('순서 글 2','44444444-4444-4444-8444-444444444440'));
select is(public.reorder_posts('44444444-4444-4444-8444-444444444440',(select array_agg(id order by id desc) from reorder_posts)),2,'post reorder updates every active post in a category transactionally');
select ok((select count(distinct position)=2 from public.posts where id in(select id from reorder_posts)),'post reorder assigns distinct positions');

select is((public.export_backup()->>'format'),'dorami-backup','owner backup has a versioned portable format');
select ok((public.analytics_summary(date '1000-01-01',date '1000-01-01')->>'total')::integer=0,'empty historical analytics range contains no fake views');
select ok(public.unpublish_post((select post_id from test_state)) is not null,'unpublish creates a deployment');
select ok((select current_publication_id is null from public.posts where id=(select post_id from test_state)),'unpublish immediately removes the dynamic public pointer');

select ok(
  has_function_privilege('service_role','public.submit_public_comment(uuid,uuid,text,text,text,text)','EXECUTE')
  and not has_function_privilege('authenticated','public.submit_public_comment(uuid,uuid,text,text,text,text)','EXECUTE'),
  'atomic comment submission is callable only by the service role'
);
select ok(
  has_function_privilege('service_role','public.record_public_view(uuid,text,text,timestamptz)','EXECUTE')
  and not has_function_privilege('authenticated','public.record_public_view(uuid,text,text,timestamptz)','EXECUTE'),
  'atomic view recording is callable only by the service role'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='owner_published_media_write'),
  'browser owner sessions cannot mutate immutable published media directly'
);

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select throws_like($$select * from public.drafts$$,'%permission denied%','anonymous users cannot request draft rows');

select * from finish();
rollback;
