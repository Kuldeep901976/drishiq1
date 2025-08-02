-- Create users table
create table public.users (
  id uuid references auth.users(id) primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text null,
  phone text null,
  language text not null default 'en',
  auth_provider text not null check (auth_provider in ('social', 'email')),
  is_profile_complete boolean default false,
  full_name text null,
  avatar_url text null,
  last_sign_in timestamp with time zone null
);

-- Create user_flow_progress table
create table public.user_flow_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  completed_steps text[] default array[]::text[],
  current_step text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create verification_codes table
create table public.verification_codes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users(id) not null,
  phone text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  is_used boolean default false
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.user_flow_progress enable row level security;
alter table public.verification_codes enable row level security;

-- Users table policies
create policy "Users can read own data"
  on public.users
  for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users
  for update
  using (auth.uid() = id);

-- User flow progress policies
create policy "Users can read own flow progress"
  on public.user_flow_progress
  for select
  using (auth.uid() = user_id);

create policy "Users can update own flow progress"
  on public.user_flow_progress
  for update
  using (auth.uid() = user_id);

create policy "Users can insert own flow progress"
  on public.user_flow_progress
  for insert
  with check (auth.uid() = user_id);

-- Verification codes policies
create policy "Users can read own verification codes"
  on public.verification_codes
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own verification codes"
  on public.verification_codes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own verification codes"
  on public.verification_codes
  for update
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Create trigger for user_flow_progress
create trigger handle_updated_at
  before update on public.user_flow_progress
  for each row
  execute function public.handle_updated_at();

-- Create function to clean up expired verification codes
create or replace function public.cleanup_expired_verification_codes()
returns trigger
language plpgsql
as $$
begin
  delete from public.verification_codes
  where expires_at < timezone('utc'::text, now())
  or is_used = true;
  return null;
end;
$$;

-- Create trigger to clean up expired verification codes
create trigger cleanup_expired_verification_codes
  after insert or update on public.verification_codes
  for each statement
  execute function public.cleanup_expired_verification_codes(); 