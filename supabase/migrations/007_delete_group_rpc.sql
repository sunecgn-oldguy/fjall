-- 007_delete_group_rpc.sql
-- RPC-funktion til at slette en gruppe og ALT relateret data.
--
-- Problemet: groups.id refereres af locations, messages, orders,
-- sheep_sightings, trips og group_members. PostgreSQL nægter DELETE
-- på groups hvis der stadig er rækker i de andre tabeller.
--
-- Løsning: En SECURITY DEFINER-funktion der sletter i rigtig rækkefølge.
-- Kun opretteren (created_by) kan kalde den.
--
-- Kør denne migration i Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.delete_group(target_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificer at kalderen er opretteren af gruppen
  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = target_group_id AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bert stovnarín kann strika bólkin';
  END IF;

  -- Slet i rækkefølge (respekterer foreign key constraints)
  DELETE FROM public.route_points WHERE trip_id IN (
    SELECT id FROM public.trips WHERE group_id = target_group_id
  );
  DELETE FROM public.trips WHERE group_id = target_group_id;
  DELETE FROM public.messages WHERE group_id = target_group_id;
  DELETE FROM public.orders WHERE group_id = target_group_id;
  DELETE FROM public.sheep_sightings WHERE group_id = target_group_id;
  DELETE FROM public.locations WHERE group_id = target_group_id;
  DELETE FROM public.group_members WHERE group_id = target_group_id;
  DELETE FROM public.groups WHERE id = target_group_id;
END;
$$;
