import { Eleve, SubjectKey } from "../models/types";
import { clamp } from "../utils/random";

/**
 * Met à jour la compétence "vraie" (visible) d'un élève dans une matière
 * après une note obtenue, via une moyenne mobile pondérée par sa capacité
 * d'apprentissage. La performance passée influence donc légèrement les
 * résultats futurs, sans les figer : une bonne note fait progresser la
 * compétence petit à petit, une mauvaise la fait redescendre lentement.
 */
export function mettreAJourCompetence(
  eleve: Eleve,
  matiere: SubjectKey,
  noteObtenue: number
): void {
  const actuelle = eleve.competences[matiere] ?? 10;
  const poidsApprentissage = 0.12 + eleve.potentiel.capaciteApprentissage * 0.18; // 0.12 - 0.30
  const nouvelle = actuelle * (1 - poidsApprentissage) + noteObtenue * poidsApprentissage;
  eleve.competences[matiere] = clamp(
    Math.round((actuelle + (nouvelle - actuelle)) * 100) / 100,
    2,
    20
  );
}

/**
 * Calcule l'indicateur de progression d'un élève à partir de l'évolution
 * de sa moyenne générale sur les 2-3 derniers trimestres enregistrés.
 * Un passage de 8 à 15 en une matière clé fait fortement grimper cet
 * indicateur, conformément au cahier des charges.
 */
export function calculerIndicateurProgression(eleve: Eleve): number {
  const historique = eleve.moyennes.slice(-3);
  if (historique.length < 2) return 0;

  const premiere = historique[0].moyenneGenerale;
  const derniere = historique[historique.length - 1].moyenneGenerale;
  const delta = derniere - premiere;

  // Normalisation sur une échelle -100 / +100
  const indicateur = clamp((delta / 8) * 100, -100, 100);
  eleve.competences.progression = Math.round(indicateur);
  return eleve.competences.progression;
}

/** Ajuste légèrement la régularité en fonction de la stabilité des notes récentes. */
export function mettreAJourRegularite(eleve: Eleve): void {
  const dernieresNotes = eleve.notes.slice(-8).map((n) => n.valeurSur20);
  if (dernieresNotes.length < 3) return;

  const moyenne = dernieresNotes.reduce((a, b) => a + b, 0) / dernieresNotes.length;
  const variance =
    dernieresNotes.reduce((acc, n) => acc + (n - moyenne) ** 2, 0) / dernieresNotes.length;
  const ecartType = Math.sqrt(variance);

  // Moins l'écart-type est élevé, plus la régularité augmente
  const cible = clamp(100 - ecartType * 12, 10, 100);
  eleve.competences.regularite = clamp(
    Math.round(eleve.competences.regularite * 0.7 + cible * 0.3),
    10,
    100
  );
}
