-- Retour à une confirmation immédiate : la validation manuelle du formateur
-- (bouton "Confirmer", cf. 0043/0044) est supprimée côté front. Un
-- rendez-vous est désormais confirmé (et son Google Meet créé, cf.
-- sync-meet-event) dès que l'élève choisit son créneau, ou dès qu'une
-- proposition de nouveau créneau est acceptée — jamais via une étape
-- intermédiaire "en attente".
alter table rendez_vous alter column status set default 'confirmed';

-- Bascule les rendez-vous encore "en attente" (créés avant ce changement) en
-- confirmé, pour qu'ils ne restent pas bloqués sans bouton pour les valider.
update rendez_vous set status = 'confirmed' where status = 'pending';
