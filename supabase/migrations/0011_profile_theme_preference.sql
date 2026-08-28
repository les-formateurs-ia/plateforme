-- Préférence de thème de l'interface (clair/sombre/système), persistée côté
-- serveur pour survivre à un rechargement et rester la même après une
-- authentification sur un autre appareil. 'system' = suit le thème du
-- système d'exploitation de l'utilisateur (valeur par défaut).
alter table profiles add column theme_preference text not null default 'system'
  check (theme_preference in ('light', 'dark', 'system'));
comment on column profiles.theme_preference is
  'Thème choisi par l''utilisateur dans les réglages : light, dark, ou system (suit le thème de l''OS).';
