-- Ponctuel, à lancer dans le SQL Editor de Supabase.
-- La colonne "role" existe déjà (créée par 0001_init_schema.sql) — pas besoin
-- de nouvelle colonne, juste de faire passer un compte de 'student' à 'admin'.
update public.profiles
set role = 'admin'
where email = 'yyuliapvv@gmail.com';  -- adapte l'email si besoin

-- Vérification :
select id, email, role, must_onboard from public.profiles;
