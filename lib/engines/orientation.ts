import { Eleve, Niveau, OrientationEntry } from "../models/types";
import {
  FILIERES_LITTERAIRES,
  FILIERES_MATHS_INFO,
  FILIERES_MATHS_PHYSIQUE,
  FILIERES_SVT,
  FiliereUniversitaire,
} from "../data/filieres";

interface ScoreOrientation {
  scientifique: number;
  litteraire: number;
}

/**
 * Calcule un score d'orientation multi-critères — jamais la moyenne
 * générale seule. Combine compétences par matière, raisonnement,
 * progression récente et une légère influence du potentiel caché.
 */
export function scoreOrientation(eleve: Eleve): ScoreOrientation {
  const c = eleve.competences;
  const progression = c.progression ?? 0;

  const scientifique =
    c.mathematiques * 0.28 +
    c.physique * 0.22 +
    c.informatique * 0.18 +
    c.svt * 0.1 +
    c.raisonnementLogique * 0.12 +
    (progression > 0 ? progression * 0.03 : 0) +
    eleve.potentiel.potentielScientifique * 0.04;

  const litteraire =
    c.francais * 0.3 +
    c.anglais * 0.2 +
    (c.philosophie ?? 10) * 0.15 +
    c.communication * 0.2 +
    (progression > 0 ? progression * 0.03 : 0) +
    eleve.potentiel.potentielLitteraire * 0.04;

  return {
    scientifique: Math.round(scientifique * 10) / 10,
    litteraire: Math.round(litteraire * 10) / 10,
  };
}

function moyenneEleve(eleve: Eleve): number {
  return eleve.moyennes[eleve.moyennes.length - 1]?.moyenneGenerale ?? 0;
}

/** Décision de fin de 3e : Seconde C ou Seconde A. */
export function orienterFinDe3e(eleve: Eleve, annee: string): OrientationEntry {
  const score = scoreOrientation(eleve);
  const destination: Niveau = score.scientifique >= score.litteraire ? "2ndeC" : "2ndeA";

  const motif =
    destination === "2ndeC"
      ? "Profil scientifique dominant (mathématiques, physique, informatique et raisonnement logique élevés)."
      : "Profil littéraire dominant (français, anglais, communication élevés).";

  return {
    annee,
    niveauOrigine: "3e",
    niveauDestination: destination,
    motif,
    scoreDetail: { ...score, moyenneGenerale: moyenneEleve(eleve) },
  };
}

/** Décision de progression générique (passage / redoublement / recalage). */
export function decisionProgression(eleve: Eleve, annee: string): "passage" | "avertissement" | "redoublement" | "recale" {
  const moyenne = moyenneEleve(eleve);
  if (moyenne >= 12) return "passage";
  if (moyenne >= 9.5) return "avertissement";
  if (moyenne >= 6) return "redoublement";
  return "recale";
}

/** Orientation après la Seconde C : 1ère C (fortement scientifique) ou 1ère D (SVT). */
export function orienterApresSecondeC(eleve: Eleve, annee: string): OrientationEntry {
  const c = eleve.competences;
  const scoreC = c.mathematiques * 0.4 + c.physique * 0.35 + c.informatique * 0.25;
  const scoreD = c.svt * 0.45 + c.physique * 0.25 + c.mathematiques * 0.3;

  const destination: Niveau = scoreC >= scoreD ? "1ereC" : "1ereD";
  const motif =
    destination === "1ereC"
      ? "Profil fortement mathématiques/physique/informatique."
      : "Profil scientifique davantage orienté sciences naturelles (SVT).";

  return {
    annee,
    niveauOrigine: "2ndeC",
    niveauDestination: destination,
    motif,
    scoreDetail: { scoreC: Math.round(scoreC * 10) / 10, scoreD: Math.round(scoreD * 10) / 10 },
  };
}

export function niveauSuivant(niveau: Niveau): Niveau | null {
  const chaineC: Niveau[] = ["2ndeC", "1ereC", "TermC"];
  const chaineD: Niveau[] = ["2ndeC", "1ereD", "TermD"];
  const chaineA: Niveau[] = ["2ndeA", "1ereA", "TermA"];

  for (const chaine of [chaineC, chaineD, chaineA]) {
    const idx = chaine.indexOf(niveau);
    if (idx !== -1 && idx < chaine.length - 1) return chaine[idx + 1];
  }
  return null; // Terminale -> fin (orientation universitaire)
}

/** Recommandation universitaire après l'examen final de Terminale. */
export function recommanderFiliereUniversitaire(eleve: Eleve): {
  filieres: FiliereUniversitaire[];
  admissiblePolytechnique: boolean;
} {
  const c = eleve.competences;
  const filieres: FiliereUniversitaire[] = [];

  const fortMathsPhysique = c.mathematiques >= 15 && c.physique >= 14;
  const fortMathsInfo = c.mathematiques >= 14 && c.informatique >= 15;
  const fortSVT = c.svt >= 15;
  const fortLitteraire = c.francais >= 15 && c.anglais >= 13 && (c.philosophie ?? 0) >= 13;

  if (fortMathsPhysique) filieres.push(...FILIERES_MATHS_PHYSIQUE);
  if (fortMathsInfo) filieres.push(...FILIERES_MATHS_INFO);
  if (fortSVT) filieres.push(...FILIERES_SVT);
  if (fortLitteraire) filieres.push(...FILIERES_LITTERAIRES);

  if (filieres.length === 0) {
    // Filière par défaut la plus proche du profil dominant
    filieres.push(
      c.mathematiques >= c.francais ? FILIERES_MATHS_INFO[0] : FILIERES_LITTERAIRES[0]
    );
  }

  const moyenne = moyenneEleve(eleve);
  const admissiblePolytechnique =
    moyenne >= 15 && c.mathematiques >= 16 && c.physique >= 14 && (eleve.niveau === "TermC");

  return { filieres, admissiblePolytechnique };
}
