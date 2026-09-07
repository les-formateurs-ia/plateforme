-- Ouvre l'édition du Playground (HTML) d'une leçon au formateur, comme le
-- reste du contenu pédagogique (lessons_admin_write, déjà is_staff() depuis
-- 0010_formateur_permissions.sql). Le trigger protect_playground_html
-- réservait ce champ précis à l'admin ; ce n'est plus voulu. Il est posé sur
-- deux tables : lessons (0010) et instance_lessons (0019, page "personnaliser").
drop trigger if exists lessons_protect_playground_html on lessons;
drop trigger if exists instance_lessons_protect_playground_html on instance_lessons;
drop function if exists protect_playground_html();
