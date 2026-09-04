-- Valeur d'enum seule dans sa propre migration : elle ne peut pas être
-- référencée dans la même transaction que celle qui l'ajoute (même précédent
-- que 'rdv_booked' en 0029).
alter type notification_type add value if not exists 'bilan_reminder';
