-- Workflow de confirmation : un rendez-vous réservé par l'élève reste "en
-- attente" tant que le formateur ne l'a pas explicitement confirmé (bouton
-- Confirmer) — le Google Meet n'est créé qu'à ce moment-là (ou quand l'élève
-- accepte une proposition de nouveau créneau), jamais à la réservation
-- initiale. Nouvelles valeurs d'enum ajoutées ici, utilisées dans la
-- migration suivante (une valeur d'enum tout juste ajoutée ne peut pas être
-- utilisée dans la même transaction, cf. 0029 → 0038 pour 'rdv_booked').
alter type rdv_status add value if not exists 'pending';
alter type notification_type add value if not exists 'rdv_confirmed';
