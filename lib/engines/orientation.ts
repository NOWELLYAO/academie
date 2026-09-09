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
    niveau === "PrepaLitteraire" ||
    niveau === "DUT" ||
    niveau === "Universite" ||
    niveau === "EcoleIngenieurs"
  );
}

/** Orientation post-Terminale : classe préparatoire scientifique ou
 * littéraire, DUT/BTS, université ou admission directe en école
 * d'ingénieurs — jamais un choix binaire, toujours selon les compétences
 * dominantes et le niveau atteint au baccalauréat. */
export function orienterPostBac(eleve: Eleve): {
  niveau: Niveau;
  motif: string;
  filieresConseillees: FiliereUniversitaire[];
  excellence: boolean;
} {
  const c = eleve.competences;
  const moyenne = moyenneEleve(eleve);
  const estFiliereScientifique = eleve.niveau === "TermC" || eleve.niveau === "TermD";

  if (estFiliereScientifique) {
    const fortMathsPhysique = c.mathematiques >= 15 && c.physique >= 14;
    const fortMathsInfo = c.mathematiques >= 14 && c.informatique >= 15;
    const fortSVT = c.svt >= 15;

    if (moyenne >= 16 && c.mathematiques >= 17 && c.physique >= 15 && eleve.niveau === "TermC") {
      return {
        niveau: "EcoleIngenieurs",
        motif: "Excellence scientifique — admission directe en école d'ingénieurs post-bac.",
        filieresConseillees: [...FILIERES_MATHS_PHYSIQUE, ...FILIERES_MATHS_INFO].slice(0, 4),
        excellence: true,
      };
    }
    if (moyenne >= 13.5 && (fortMathsPhysique || fortMathsInfo)) {
      return {
        niveau: "PrepaScientifique",
        motif: "Bon niveau scientifique — classe préparatoire (CPGE) visant les concours d'écoles d'ingénieurs.",
        filieresConseillees: [...FILIERES_MATHS_PHYSIQUE, ...FILIERES_MATHS_INFO].slice(0, 4),
        excellence: false,
      };
    }
    if (fortSVT && moyenne >= 13) {
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
        motif: "Niveau correct mais profil plus technique — DUT/BTS pour une insertion professionnelle rapide.",
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

  // TermA — profil littéraire
  const fortLitteraire = c.francais >= 15 && c.anglais >= 13 && (c.philosophie ?? 0) >= 13;

  if (moyenne >= 15 && fortLitteraire) {
    return {
      niveau: "PrepaLitteraire",
      motif: "Excellent profil littéraire — classe préparatoire littéraire (objectif Sciences Po / ENS).",
      filieresConseillees: FILIERES_LITTERAIRES,
      excellence: true,
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
    motif: "Orientation vers un DUT/BTS pour un parcours plus court et professionnalisant.",
    filieresConseillees: FILIERES_LITTERAIRES.slice(0, 2),
    excellence: false,
  };
}
