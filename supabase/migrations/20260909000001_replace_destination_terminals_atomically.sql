-- Terminal replacement must happen in one transaction. A published Airport Page
-- cannot commit with zero terminals between the delete and insert operations.
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
begin
  if jsonb_typeof(p_terminals) <> 'array' or jsonb_array_length(p_terminals) = 0 then
    raise exception 'An Airport Page must have at least one terminal';
  end if;

  select count(*) filter (where (value->>'isPrimary')::boolean)
    into primary_count
    from jsonb_array_elements(p_terminals);

  if primary_count <> 1 then
    raise exception 'An Airport Page must have exactly one primary terminal';
  end if;

  -- Move existing rows out of the way before deleting them. This avoids the
  -- unique sort-order constraint while the replacement rows are prepared.
  update destination_page_terminals
  set sort_order = sort_order + 1000000,
      is_primary = false
  where page_id = p_page_id;

  delete from destination_page_terminals where page_id = p_page_id;

  for terminal in select value from jsonb_array_elements(p_terminals) loop
    insert into destination_page_terminals (
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
