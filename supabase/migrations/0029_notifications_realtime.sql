-- Notifications en temps réel : la cloche ne doit plus attendre un rechargement
-- de page ni un polling pour afficher une nouvelle notification — on diffuse
-- les inserts sur `notifications` via Supabase Realtime (RLS déjà en place,
-- donc chaque utilisateur ne reçoit que les siennes).
alter publication supabase_realtime add table notifications;

-- Notification supplémentaire : le formateur/admin attribué est prévenu
-- quand son élève réserve ou déplace un rendez-vous parmi ses disponibilités.
alter type notification_type add value 'rdv_booked';
