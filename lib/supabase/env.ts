// Lecture + validation des variables d'environnement Supabase publiques.
// Évite les assertions `!` qui produisent des erreurs runtime obscures si la
// configuration est absente ; ici le message est explicite.
export function supabaseEnv(): { url: string; anon: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "Configuration Supabase manquante : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis."
    );
  }
  return { url, anon };
}
