-- 006_fix_group_policies.sql
-- Løser to RLS-problemer:
-- 1. Brugere kunne ikke forlade grupper (ingen DELETE-policy på group_members)
-- 2. Oprettere kunne ikke slette deres grupper (ingen DELETE-policy på groups)
--
-- Kør denne migration i Supabase SQL Editor.

-- Brugere kan forlade en gruppe (fjerne sig selv fra group_members)
CREATE POLICY "Users can leave groups"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Opretteren af en gruppe kan slette den
CREATE POLICY "Creator can delete group"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Opretteren kan også slette andre medlemmer fra sin gruppe
-- (nødvendigt for at cascade-slette medlemmer før gruppen slettes)
CREATE POLICY "Creator can remove members from own group"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
        AND groups.created_by = auth.uid()
    )
  );
