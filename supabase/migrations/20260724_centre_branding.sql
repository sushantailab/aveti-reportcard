-- Per-centre branding and contact details.
alter table public.centres
  add column if not exists email text,
  add column if not exists centre_head_name text,
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('centre-branding', 'centre-branding', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "centre_branding_master_read" on storage.objects;
create policy "centre_branding_master_read" on storage.objects for select to authenticated
using (bucket_id = 'centre-branding' and app_private.is_platform_admin());

drop policy if exists "centre_branding_master_upload" on storage.objects;
create policy "centre_branding_master_upload" on storage.objects for insert to authenticated
with check (bucket_id = 'centre-branding' and app_private.is_platform_admin());

drop policy if exists "centre_branding_master_update" on storage.objects;
create policy "centre_branding_master_update" on storage.objects for update to authenticated
using (bucket_id = 'centre-branding' and app_private.is_platform_admin())
with check (bucket_id = 'centre-branding' and app_private.is_platform_admin());

drop policy if exists "centre_branding_master_delete" on storage.objects;
create policy "centre_branding_master_delete" on storage.objects for delete to authenticated
using (bucket_id = 'centre-branding' and app_private.is_platform_admin());
