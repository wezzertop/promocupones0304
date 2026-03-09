create table if not exists public.reputation_transfers (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  amount integer not null check (amount in (1, 3, 5)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_sender_receiver unique (sender_id, receiver_id),
  constraint self_transfer_check check (sender_id != receiver_id)
);

-- Add RLS policies
alter table public.reputation_transfers enable row level security;

create policy "Users can view all reputation transfers"
  on public.reputation_transfers for select
  using (true);

create policy "Users can insert their own transfers"
  on public.reputation_transfers for insert
  with check (auth.uid() = sender_id);
