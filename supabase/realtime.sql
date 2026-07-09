-- Enable Supabase Realtime for the AutoParts tables.
-- Run once in the Supabase SQL Editor. Idempotent: skips tables already enabled.

do $$
declare
  t text;
begin
  foreach t in array array[
    'products','categories','customers','suppliers','sales','purchases','movements'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
