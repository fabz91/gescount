-- GESCOUNT v12 : espace des justificatifs (PDF chiffrés sur le PC avant l'envoi).
-- À lancer UNE fois : Supabase > SQL Editor > New query > coller > Run.
-- Seuls les comptes qui ont le droit de lire la table « gescount » peuvent lire ou envoyer ces fichiers
-- (le test « exists (select 1 from public.gescount) » applique les mêmes règles que la table).
insert into storage.buckets (id, name, public, file_size_limit)
values ('gescount', 'gescount', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "gescount fichiers lecture" on storage.objects;
drop policy if exists "gescount fichiers ajout" on storage.objects;
drop policy if exists "gescount fichiers modif" on storage.objects;

create policy "gescount fichiers lecture" on storage.objects for select to authenticated
  using (bucket_id = 'gescount' and exists (select 1 from public.gescount));
create policy "gescount fichiers ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'gescount' and exists (select 1 from public.gescount));
create policy "gescount fichiers modif" on storage.objects for update to authenticated
  using (bucket_id = 'gescount' and exists (select 1 from public.gescount))
  with check (bucket_id = 'gescount' and exists (select 1 from public.gescount));
