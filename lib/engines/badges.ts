import { Eleve } from "../models/types";

export interface Badge {
  titre: string;
  icone: string;
  description: string;
}

/** Calcule les titres/badges spéciaux mérités par un élève, à partir de
 * ses compétences dominantes, de sa progression et de son potentiel
 * caché. Un élève peut cumuler plusieurs badges. */
export function calculerBadges(eleve: Eleve): Badge[] {
  const c = eleve.competences;
  const badges: Badge[] = [];

  if (c.mathematiques >= 18) {
    badges.push({
      titre: "Génie des mathématiques",
      icone: "🧮",
      description: "Maîtrise exceptionnelle des mathématiques.",
    });
  }
  if (c.physique >= 18 && c.mathematiques >= 16) {
    badges.push({
      titre: "Physicien prodige",
      icone: "🔭",
      description: "Une intuition physique qui sort de l'ordinaire.",
    });
  }
  if (c.informatique >= 17 && c.raisonnementLogique >= 16) {
    badges.push({
      titre: "Esprit inventif",
      icone: "💡",
      description: "Logique et informatique au service de l'innovation.",
    });
  }
  if (c.svt >= 18) {
    badges.push({
      titre: "Naturaliste accompli",
      icone: "🔬",
      description: "Un talent rare pour les sciences de la vie et de la terre.",
    });
  }
  if (c.francais >= 18 && c.communication >= 16) {
    badges.push({
      titre: "Plume brillante",
      icone: "🖋️",
      description: "Une expression écrite d'une grande finesse.",
    });
  }
  if ((c.philosophie ?? 0) >= 17) {
    badges.push({
      titre: "Esprit philosophe",
      icone: "🦉",
      description: "Une pensée déjà affûtée pour son âge.",
    });
  }
  if (c.anglais >= 18) {
    badges.push({
      titre: "Grand linguiste",
      icone: "🌍",
      description: "Une aisance remarquable dans les langues.",
    });
  }
  if ((c.progression ?? 0) >= 55) {
    badges.push({
      titre: "Fulgurante progression",
      icone: "🚀",
      description: "Une trajectoire ascendante impressionnante ces derniers trimestres.",
    });
  }
  const potMax = Math.max(eleve.potentiel.potentielScientifique, eleve.potentiel.potentielLitteraire);
  if (potMax >= 90) {
    badges.push({
      titre: "Potentiel hors normes",
      icone: "⭐",
      description: "Un potentiel caché exceptionnel, encore en développement.",
    });
  }
  if (eleve.admissiblePolytechnique) {
    badges.push({
      titre: "Excellence post-bac",
      icone: "🏛️",
      description: "Admission d'excellence après le baccalauréat.",
    });
  }

  return badges;
}
