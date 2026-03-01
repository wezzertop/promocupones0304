
-- Create storage bucket for deals
insert into storage.buckets (id, name, public)
values ('deals', 'deals', true)
on conflict (id) do nothing;

-- Set up access policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'deals' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'deals' and auth.role() = 'authenticated' );
