-- Rumah Anabul database setup.
-- Run this once in Supabase: SQL Editor → New query → paste everything → Run.

-- Dogs posted by owners who need to rehome them
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  owner_name text not null,
  name text not null,
  breed text,
  age_group text not null check (age_group in ('puppy', 'young', 'adult', 'senior')),
  age_text text,
  sex text not null check (sex in ('male', 'female')),
  size text not null check (size in ('small', 'medium', 'large')),
  province text not null,
  city text not null,
  reason text not null check (reason in ('moving', 'financial', 'time', 'health', 'allergy', 'landlord', 'other')),
  story text not null,
  vaccinated boolean not null default false,
  sterilized boolean not null default false,
  good_with text[] not null default '{}',
  photo_url text,
  status text not null default 'available' check (status in ('available', 'reserved', 'adopted')),
  created_at timestamptz not null default now()
);

alter table public.dogs enable row level security;

create policy "Anyone can view dogs" on public.dogs
  for select using (true);
create policy "Owners can post dogs" on public.dogs
  for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can update their dogs" on public.dogs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners can delete their dogs" on public.dogs
  for delete to authenticated using (owner_id = auth.uid());

-- Adoption applications sent by adopters
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  applicant_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  applicant_name text not null,
  phone text not null,
  city text not null,
  home_type text not null check (home_type in ('house', 'apartment', 'kos')),
  has_yard boolean not null default false,
  experience text not null,
  other_pets text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (dog_id, applicant_id)
);

alter table public.applications enable row level security;

-- Applicants see their own applications; owners see applications for their dogs.
-- Nobody else can read them, so phone numbers stay private.
create policy "Applicants and owners can view applications" on public.applications
  for select to authenticated using (
    applicant_id = auth.uid()
    or exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid())
  );

-- You can only apply for someone else's dog, and only while it's available
create policy "Adopters can apply" on public.applications
  for insert to authenticated with check (
    applicant_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.owner_id <> auth.uid() and d.status = 'available'
    )
  );

-- Only the dog's owner can accept or decline, and only the status column can change
create policy "Owners can decide on applications" on public.applications
  for update to authenticated using (
    exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid())
  );
revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;

-- Let the website use the tables at all (newer Supabase projects don't do this automatically).
-- The policies above still decide which rows each person can see or change.
grant usage on schema public to anon, authenticated;
grant select on public.dogs to anon, authenticated;
grant insert, update, delete on public.dogs to authenticated;
grant select, insert on public.applications to authenticated;

-- Photo storage: anyone can view, each user uploads into their own folder
insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

create policy "Users can upload their own dog photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users can delete their own dog photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text);
