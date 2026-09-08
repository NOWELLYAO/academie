import { Eleve, SubjectKey } from "../models/types";
import { RNG, clamp, randGauss } from "../utils/random";

/**
 * Calcule la note "brute" (sur 20) que produit un élève à une évaluation
 * donnée, à partir de :
 *  - sa compétence visible actuelle dans la matière (évolue lentement) ;
 *  - un bruit aléatoire pondéré par sa volatilité (potentiel caché) ;
 *  - un effet ponctuel du potentiel caché ("coup d'éclat") qui peut faire
 *    dépasser temporairement la compétence visible, notamment chez les
 *    élèves à fort potentiel mais compétence encore moyenne ;
 *  - la difficulté implicite de l'évaluation (coefficient/barème).
 *
 * C'est cette fonction qui garantit que deux élèves à 12/20 aujourd'hui
 * peuvent diverger fortement : leur volatilité et leur potentiel caché
 * ne sont jamais identiques.
 */
export function genererNoteBrute(
  rng: RNG,
  eleve: Eleve,
  matiere: SubjectKey,
  difficulte: number = 1 // 1 = normal, >1 = évaluation plus exigeante
): number {
  const competenceActuelle = eleve.competences[matiere] ?? 10;
  const { volatilite, potentielScientifique, potentielLitteraire } = eleve.potentiel;

  // Bruit standard, amplifié par la volatilité de l'élève
  const ecartType = 1.2 + volatilite * 3.5;
  let note = randGauss(rng, competenceActuelle, ecartType);

  // Effet "coup d'éclat" : probabilité faible mais non nulle qu'un fort
  // potentiel caché (encore non exprimé dans la compétence visible)
  // produise une performance nettement au-dessus de la moyenne habituelle.
  const potentielPertinent = estMatiereScientifique(matiere)
    ? potentielScientifique
    : potentielLitteraire;

  if (potentielPertinent > competenceActuelle * 5 && rng() < 0.12) {
    note += randGauss(rng, (potentielPertinent - competenceActuelle * 5) / 8, 1.5);
  }

  // Effet de la difficulté de l'évaluation
  note -= (difficulte - 1) * 1.5;

  return clamp(Math.round(note * 10) / 10, 0, 20);
}

function estMatiereScientifique(matiere: SubjectKey): boolean {
  return (
    matiere === "mathematiques" ||
    matiere === "physique" ||
    matiere === "svt" ||
    matiere === "informatique"
  );
}

/** Qualifie le potentiel caché d'un élève en libellé lisible (jamais le chiffre brut). */
export function qualifierPotentiel(eleve: Eleve): string {
  const max = Math.max(
    eleve.potentiel.potentielScientifique,
    eleve.potentiel.potentielLitteraire
  );
  if (max >= 80) return "Potentiel : exceptionnel";
  if (max >= 60) return "Potentiel : à fort développement";
  if (max >= 40) return "Potentiel : à confirmer";
  return "Potentiel : encore incertain";
}

export function qualifierVolatilite(eleve: Eleve): string {
  const v = eleve.potentiel.volatilite;
  if (v > 0.6) return "Trajectoire irrégulière";
  if (v > 0.3) return "Trajectoire variable";
  return "Trajectoire stable";
}
