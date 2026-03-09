create or replace function transfer_reputation_points(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_amount integer
) returns void as $$
declare
  v_sender_points integer;
begin
  -- Check amount validity
  if p_amount not in (1, 3, 5) then
    raise exception 'Invalid amount';
  end if;

  -- Check self-transfer
  if p_sender_id = p_receiver_id then
    raise exception 'Cannot transfer points to self';
  end if;

  -- Check if already transferred
  if exists (select 1 from public.reputation_transfers where sender_id = p_sender_id and receiver_id = p_receiver_id) then
    raise exception 'Already transferred points to this user';
  end if;

  -- Check sender balance
  select karma_points into v_sender_points from public.users where id = p_sender_id;
  if v_sender_points < p_amount then
    raise exception 'Insufficient points';
  end if;

  -- Deduct from sender
  update public.users set karma_points = karma_points - p_amount where id = p_sender_id;

  -- Add to receiver
  update public.users set karma_points = karma_points + p_amount where id = p_receiver_id;

  -- Log transfer
  insert into public.reputation_transfers (sender_id, receiver_id, amount)
  values (p_sender_id, p_receiver_id, p_amount);
end;
$$ language plpgsql security definer;
