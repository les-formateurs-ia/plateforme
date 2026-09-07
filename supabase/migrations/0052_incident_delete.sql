-- Un admin doit pouvoir supprimer définitivement un incident déjà corrigé
-- depuis longtemps (pas seulement le marquer "corrigé") — aucune policy
-- delete n'existait sur reported_incidents (0041), donc la RLS bloquait
-- silencieusement toute tentative.
create policy "reported_incidents_admin_delete" on reported_incidents for delete
  using (is_admin());
