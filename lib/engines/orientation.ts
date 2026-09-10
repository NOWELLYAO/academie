import { Eleve, Niveau, OrientationEntry } from "../models/types";
import { RNG } from "../utils/random";
import {
  FILIERES_COMMERCE,
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

/** Un élève ne passe un examen national (BEPC / Baccalauréat) qu'en 3e et
 * en Terminale. Les autres niveaux (Seconde, Première) sont évalués sur
 * la seule moyenne annuelle de contrôle continu. */
export function estNiveauExamen(niveau: Niveau): boolean {
  return (
    niveau === "3e" ||
    niveau === "TermA" ||
    niveau === "TermC" ||
    niveau === "TermD" ||
    niveau === "PrepaScientifique" ||
    niveau === "PrepaBio" ||
    niveau === "PrepaGenieCivil" ||
    niveau === "PrepaCommerce" ||
    niveau === "PrepaLitteraire" ||
    niveau === "DUT" ||
    niveau === "Universite" ||
    niveau === "EcoleIngenieurs" ||
    niveau === "EcoleCommerce"
  );
}

/** Orientation post-Terminale : classe préparatoire scientifique ou
 * littéraire, DUT/BTS, université ou admission directe en école
 * d'ingénieurs — jamais un choix binaire, toujours selon les compétences
 * dominantes et le niveau atteint au baccalauréat. */
export function orienterPostBac(
  eleve: Eleve,
  rng: RNG
): {
  niveau: Niveau;
  motif: string;
  filieresConseillees: FiliereUniversitaire[];
  excellence: boolean;
} {
  const c = eleve.competences;
  const moyenne = moyenneEleve(eleve);

  // AUCUNE admission directe en école d'ingénieurs depuis la Terminale,
  // quel que soit le niveau : tout le monde passe soit par une classe
  // préparatoire (2 ans) puis le concours GBINZIN, soit par un DUT
  // (3 ans) où seuls les 5 meilleurs de chaque filière technique
  // rejoignent ensuite les classes d'ingénieurs (voir simulation.ts).

  // Série C — scientifique pur.
  if (eleve.niveau === "TermC") {
    // MPSI (Techno) : fortes notes en Maths ET Physique.
    const fortMPSI = c.mathematiques >= 16 && c.physique >= 15;
    // Prépa Commerce : fortes notes en Maths, Français ET Anglais.
    const fortCommerce = c.mathematiques >= 15 && c.francais >= 14 && c.anglais >= 14;
    // Prépa Génie Civil / Mines / Sciences de l'Eau : bonnes notes en
    // Maths, Physique ET SVT.
    const fortGenieCivil = c.mathematiques >= 14 && c.physique >= 14 && c.svt >= 12;

    if (moyenne >= 14 && fortCommerce && rng() < 0.15) {
      return {
        niveau: "PrepaCommerce",
        motif: "Bon profil polyvalent (Maths/Français/Anglais) — classe préparatoire Commerce.",
        filieresConseillees: FILIERES_COMMERCE,
        excellence: false,
      };
    }
    if (moyenne >= 13 && fortGenieCivil && rng() < 0.12) {
      return {
        niveau: "PrepaGenieCivil",
        motif: "Bon profil scientifique large (Maths/Physique/SVT) — classe préparatoire Génie Civil / Mines / Sciences de l'Eau.",
        filieresConseillees: FILIERES_MATHS_PHYSIQUE,
        excellence: false,
      };
    }
    if (moyenne >= 14 && fortMPSI) {
      return {
        niveau: "PrepaScientifique",
        motif: "Fortes notes en Maths et Physique — classe préparatoire MPSI visant le concours GBINZIN.",
        filieresConseillees: [...FILIERES_MATHS_PHYSIQUE, ...FILIERES_MATHS_INFO].slice(0, 4),
        excellence: false,
      };
    }
    if (moyenne >= 10) {
      return {
        niveau: "DUT",
        motif: "Niveau correct mais profil plus technique — DUT en 3 ans (accès possible aux classes d'ingénieurs pour les 5 meilleurs de la filière).",
        filieresConseillees: [...FILIERES_MATHS_INFO, ...FILIERES_MATHS_PHYSIQUE].slice(0, 3),
        excellence: false,
      };
    }
    return {
      niveau: "Universite",
      motif: "Poursuite en université, filière scientifique généraliste.",
      filieresConseillees: FILIERES_MATHS_INFO.slice(0, 2),
      excellence: false,
    };
  }

  // Série D — scientifique / SVT.
  if (eleve.niveau === "TermD") {
    // Prépa Bio (BCPST) : fortes notes en SVT, bonnes en Maths et en Physique.
    const fortBio = c.svt >= 15 && c.mathematiques >= 13 && c.physique >= 13;
    const fortGenieCivil = c.mathematiques >= 14 && c.physique >= 14 && c.svt >= 12;

    if (moyenne >= 13 && fortBio) {
      return {
        niveau: "PrepaBio",
        motif: "Fortes notes en SVT, bon niveau Maths — classe préparatoire Bio (BCPST) visant le concours GBINZIN.",
        filieresConseillees: FILIERES_SVT,
        excellence: false,
      };
    }
    if (moyenne >= 13 && fortGenieCivil) {
      return {
        niveau: "PrepaGenieCivil",
        motif: "Bon profil scientifique large (Maths/Physique/SVT) — classe préparatoire Génie Civil / Mines / Sciences de l'Eau.",
        filieresConseillees: FILIERES_MATHS_PHYSIQUE,
        excellence: false,
      };
    }
    if (c.svt >= 13 && moyenne >= 12) {
      return {
        niveau: "Universite",
        motif: "Profil SVT solide — parcours universitaire scientifique (biologie, médecine, agronomie).",
        filieresConseillees: FILIERES_SVT,
        excellence: false,
      };
    }
    if (moyenne >= 10) {
      return {
        niveau: "DUT",
        motif: "Niveau correct mais profil plus technique — DUT en 3 ans (accès possible aux classes d'ingénieurs pour les 5 meilleurs de la filière).",
        filieresConseillees: FILIERES_SVT.slice(0, 2),
        excellence: false,
      };
    }
    return {
      niveau: "Universite",
      motif: "Poursuite en université, filière scientifique généraliste.",
      filieresConseillees: FILIERES_SVT.slice(0, 2),
      excellence: false,
    };
  }

  // Série A — littéraire.
  const fortLitteraire = c.francais >= 15 && c.anglais >= 13 && (c.philosophie ?? 0) >= 13;
  const fortCommerceA = c.mathematiques >= 15 && c.francais >= 14 && c.anglais >= 14;

  if (moyenne >= 15 && fortLitteraire && rng() < 0.7) {
    return {
      niveau: "PrepaLitteraire",
      motif: "Excellent profil littéraire — classe préparatoire littéraire (objectif Sciences Po / ENS).",
      filieresConseillees: FILIERES_LITTERAIRES,
      excellence: true,
    };
  }
  if (moyenne >= 14 && fortCommerceA && rng() < 0.3) {
    return {
      niveau: "PrepaCommerce",
      motif: "Bon profil polyvalent (Maths/Français/Anglais) — classe préparatoire Commerce.",
      filieresConseillees: FILIERES_COMMERCE,
      excellence: false,
    };
  }
  if (moyenne >= 10) {
    return {
      niveau: "Universite",
      motif: "Poursuite en université, filière lettres/droit/communication selon affinités.",
      filieresConseillees: FILIERES_LITTERAIRES,
      excellence: false,
    };
  }
  return {
    niveau: "DUT",
    motif: "Orientation vers un DUT en 3 ans, parcours professionnalisant.",
    filieresConseillees: FILIERES_LITTERAIRES.slice(0, 2),
    excellence: false,
  };
}
