-- Permet à un formateur de coller une page HTML autonome (site, outil interactif, etc.)
-- pour une leçon. Quand ce contenu est renseigné, l'onglet "HTML" de la leçon l'affiche
-- dans un unique conteneur isolé (iframe sandboxée), à la place des conteneurs
-- Vidéo/Cours/Quiz habituels.
alter table lessons add column custom_html_content text;
comment on column lessons.custom_html_content is
  'Page HTML complète fournie par le formateur, affichée telle quelle dans l''onglet "HTML" de la leçon (rendue dans une iframe sandboxée côté client).';
