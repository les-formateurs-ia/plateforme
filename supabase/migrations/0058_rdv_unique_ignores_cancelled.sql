-- Le constraint unique (formateur_id, slot_date, start_time) posé en 0023
-- bloque à tort la réutilisation d'un créneau une fois qu'il a été réservé
-- puis annulé : la ligne annulée n'est jamais supprimée et occupe la clé
-- unique pour toujours, alors que check_rendez_vous_constraints()
-- (0025/0038/0044/0049) exclut déjà correctement les rendez-vous annulés
-- des vérifications de chevauchement/doublon. Remplacé par un index unique
-- partiel qui ignore les lignes annulées, cohérent avec cette logique.
alter table rendez_vous drop constraint rendez_vous_formateur_id_slot_date_start_time_key;
create unique index rendez_vous_formateur_slot_active_uidx on rendez_vous (formateur_id, slot_date, start_time) where status <> 'cancelled';
