-- Drafts can be completed one tab at a time. Published Airport Pages still
-- require at least one terminal and exactly one primary terminal.
create or replace function public.replace_destination_page_terminals(
  p_page_id uuid,
  p_terminals jsonb
)
returns void
language plpgsql
set search_path = public
as $$
declare
  terminal jsonb;
  terminal_index integer := 0;
  primary_count integer;
  page_lifecycle_state text;
begin
  select lifecycle_state into page_lifecycle_state
  from public.destination_pages
  where id = p_page_id;

  if jsonb_typeof(p_terminals) <> 'array' then
    raise exception 'Airport terminals must be provided as an array';
  end if;

  if jsonb_array_length(p_terminals) = 0 and page_lifecycle_state = 'draft' then
    delete from public.destination_page_terminals where page_id = p_page_id;
    return;
  end if;

  if jsonb_array_length(p_terminals) = 0 then
    raise exception 'An Airport Page must have at least one terminal';
  end if;

  select count(*) filter (where (value->>'isPrimary')::boolean)
    into primary_count
    from jsonb_array_elements(p_terminals);

  if primary_count <> 1 then
    raise exception 'An Airport Page must have exactly one primary terminal';
  end if;

  update public.destination_page_terminals
  set sort_order = sort_order + 1000000,
      is_primary = false
  where page_id = p_page_id;

  delete from public.destination_page_terminals where page_id = p_page_id;

  for terminal in select value from jsonb_array_elements(p_terminals) loop
    insert into public.destination_page_terminals (
      page_id, display_name, address, latitude, longitude, sort_order, is_primary
    ) values (
      p_page_id,
      terminal->>'displayName',
      terminal->>'address',
      (terminal->>'latitude')::double precision,
      (terminal->>'longitude')::double precision,
      terminal_index,
      (terminal->>'isPrimary')::boolean
    );
    terminal_index := terminal_index + 1;
  end loop;
end;
$$;

revoke all on function public.replace_destination_page_terminals(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_destination_page_terminals(uuid, jsonb) to service_role;
