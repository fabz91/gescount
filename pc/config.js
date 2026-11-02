// ============================================================
//  GESCOUNT - réglages modifiables
//  (après une modification, refaites l'installateur avec CREER-INSTALLATEUR.bat)
// ============================================================
module.exports = {
  // Adresse des mises à jour (dépôt GitHub public qui contient index.html et version.json).
  // Laisser vide ('') pour désactiver le bouton « Mettre à jour le logiciel ».
  updateUrl: 'https://raw.githubusercontent.com/fabz91/gescount/main',

  // Base en ligne Supabase : mêmes valeurs que dans le config.js de GESMAR / GESTIME.
  // Ne mettez JAMAIS ici la clé « secret » ou « service_role », seulement la clé « publishable ».
  // GESCOUNT demande en plus une connexion (e-mail + mot de passe d'un compte Supabase, voir LISEZ-MOI).
  supabaseUrl: '',
  supabaseKey: ''
};
