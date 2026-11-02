# GESCOUNT

Salaires, congés, relevés bancaires et analyses de dépenses (G20 BREDIS / CLAMART). Troisième logiciel GES, même base que GESMAR.

- `index.html` : le logiciel (sans aucune donnée de magasin). **Seul fichier source** : on le modifie directement.
- `version.json` : numéro de la dernière version (comparé à `<meta name="gc-version">` et `APP_VERSION`).
- `pc/` : kit du programme PC Windows (Electron + installateur NSIS). Données chiffrées dans `%APPDATA%\GESCOUNT\donnees`.
- `pc/supabase-gescount.sql` : à lancer une fois dans Supabase. Table `gescount` **réservée aux comptes connectés** (pas d'accès avec la seule clé publishable).

Sécurité : connexion obligatoire (compte Supabase e-mail + mot de passe), verrouillage automatique sans activité, données du PC chiffrées (AES-GCM, clé tirée du mot de passe).

Pour publier une nouvelle version : modifier `index.html`, mettre le même numéro dans `<meta name="gc-version" content="N">`, `APP_VERSION=N` et `version.json`, puis tout pousser en une fois.
