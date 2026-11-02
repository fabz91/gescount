-- GESCOUNT : table de synchronisation entre les PC, RÉSERVÉE AUX COMPTES CONNECTÉS.
-- À coller UNE FOIS dans Supabase : menu « SQL Editor » > « New query » > coller > « Run ».
-- Ne touche pas aux données de GESTIME ni de GESMAR. Peut être relancé sans risque.
--
-- Différence avec GESMAR / GESTIME : les salaires et les comptes bancaires sont sensibles.
-- La clé « publishable » seule ne suffit PAS pour lire ou écrire cette table :
-- il faut être connecté avec un compte créé dans Supabase (Authentication > Users).

create table if not exists public.gescount (
  id         text primary key,                   -- 'bredis', 'clamart'
  data       jsonb not null default '{}'::jsonb,  -- toutes les données du magasin
  rev        integer not null default 0,          -- numéro de révision (évite qu'un poste écrase l'autre)
  updated_at timestamptz not null default now()
);

alter table public.gescount enable row level security;

-- Aucun accès sans connexion (rôle « anon ») : seulement les comptes connectés (« authenticated »).
revoke all on public.gescount from anon;
drop policy if exists "gescount lecture" on public.gescount;
drop policy if exists "gescount ajout"   on public.gescount;
drop policy if exists "gescount modif"   on public.gescount;
create policy "gescount lecture" on public.gescount for select to authenticated using (true);
create policy "gescount ajout"   on public.gescount for insert to authenticated with check (true);
create policy "gescount modif"   on public.gescount for update to authenticated using (true) with check (true);
grant select, insert, update on public.gescount to authenticated;

insert into public.gescount (id) values ('bredis'), ('clamart') on conflict (id) do nothing;

select id, rev from public.gescount order by id;  -- doit afficher 2 lignes : bredis, clamart
