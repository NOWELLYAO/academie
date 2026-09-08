export type NiveauMention = "felicitations" | "tableau_honneur" | "encouragements";

export const LIBELLE_MENTION: Record<NiveauMention, string> = {
  felicitations: "Félicitations",
  tableau_honneur: "Tableau d'honneur",
  encouragements: "Encouragements",
};

export const SEUIL_MENTION: Record<NiveauMention, number> = {
  felicitations: 16,
  tableau_honneur: 14,
  encouragements: 12,
};

/** Calcule la mention méritée pour une moyenne donnée (règles classiques
 * du système scolaire francophone). Retourne null en dessous de 12/20. */
export function calculerMention(moyenne: number): NiveauMention | null {
  if (moyenne >= SEUIL_MENTION.felicitations) return "felicitations";
  if (moyenne >= SEUIL_MENTION.tableau_honneur) return "tableau_honneur";
  if (moyenne >= SEUIL_MENTION.encouragements) return "encouragements";
  return null;
}
