import { v4 as uuid } from "uuid";
import { Eleve, EvenementScolaire, ProfilType, SubjectKey } from "../models/types";
import { RNG, clamp, pick } from "../utils/random";

const MATIERES_TIRABLES: SubjectKey[] = [
  "mathematiques",
  "physique",
  "svt",
  "francais",
  "anglais",
  "informatique",
];

/**
 * Tire, pour un élève et un trimestre donnés, un éventuel événement
 * scolaire. La probabilité et le type dépendent du potentiel caché
 * (résilience, volatilité) de l'élève.
 */
export function tirerEvenement(
  rng: RNG,
  eleve: Eleve,
  trimestre: number,
  annee: string
): EvenementScolaire | null {
  const { resilience, volatilite } = eleve.potentiel;
  const probabiliteBase = 0.08 + volatilite * 0.12; // 8% à 20%

  if (rng() > probabiliteBase) return null;

  const roll = rng();
  let type: EvenementScolaire["type"];

  if (roll < 0.35) type = "progression_exceptionnelle";
  else if (roll < 0.6) type = "baisse_niveau";
  else if (roll < 0.75) type = "changement_profil";
  else if (roll < 0.92) type = "declic";
  else type = "irregularite";

  return construireEvenement(rng, eleve, type, trimestre, annee, resilience);
}

function construireEvenement(
  rng: RNG,
  eleve: Eleve,
  type: EvenementScolaire["type"],
  trimestre: number,
  annee: string,
  resilience: number
): EvenementScolaire {
  const matiere = pick(rng, MATIERES_TIRABLES);
  const nomComplet = `${eleve.nom} ${eleve.prenom}`;
  const impact: { competence: string; delta: number }[] = [];
  let description = "";

  switch (type) {
    case "progression_exceptionnelle": {
      const delta = 2 + rng() * 3;
      eleve.competences[matiere] = clamp(eleve.competences[matiere] + delta, 2, 20);
      impact.push({ competence: matiere, delta: Math.round(delta * 10) / 10 });
      description = `${nomComplet} a connu un déclic en ${matiere} ce trimestre.`;
      break;
    }
    case "baisse_niveau": {
      const deltaBrut = 1.5 + rng() * 3;
      const attenuation = 1 - resilience * 0.6; // les élèves résilients encaissent mieux
      const delta = -deltaBrut * attenuation;
      eleve.competences[matiere] = clamp(eleve.competences[matiere] + delta, 2, 20);
      impact.push({ competence: matiere, delta: Math.round(delta * 10) / 10 });
      description = `${nomComplet} traverse une baisse de régime en ${matiere} ce trimestre.`;
      break;
    }
    case "changement_profil": {
      const nouveauProfil = reorienterProfil(eleve.profilActuel, rng);
      eleve.profilActuel = nouveauProfil;
      impact.push({ competence: "profil", delta: 0 });
      description = `${nomComplet} révèle un profil plus ${libelleProfil(
        nouveauProfil
      )} qu'attendu.`;
      break;
    }
    case "declic": {
      eleve.assiduite = clamp(eleve.assiduite + 5 + rng() * 10, 0, 100);
      eleve.competences.regularite = clamp(
        eleve.competences.regularite + 5 + rng() * 8,
        0,
        100
      );
      impact.push({ competence: "regularite", delta: 8 });
      description = `${nomComplet} montre une prise de conscience et une meilleure implication.`;
      break;
    }
    case "irregularite": {
      description = `${nomComplet} enchaîne des résultats en dents de scie ce trimestre.`;
      break;
    }
  }

  return {
    id: uuid(),
    type,
    matiereConcernee: type === "changement_profil" ? undefined : matiere,
    trimestre,
    annee,
    niveau: eleve.niveau,
    description,
    impact,
  };
}

function reorienterProfil(actuel: ProfilType, rng: RNG): ProfilType {
  if (actuel === "litteraire" && rng() < 0.5) return "equilibre";
  if (actuel === "difficulte" && rng() < 0.5) return "equilibre";
  if (actuel === "equilibre") return rng() < 0.5 ? "scientifique" : "litteraire";
  return actuel;
}

function libelleProfil(p: ProfilType): string {
  const map: Record<ProfilType, string> = {
    scientifique: "scientifique",
    litteraire: "littéraire",
    equilibre: "équilibré",
    difficulte: "fragile",
    irregulier: "irrégulier",
  };
  return map[p];
}
