import { v4 as uuid } from "uuid";
import {
  Classe,
  Eleve,
  PotentielCache,
  ProfilType,
  ScoresCompetences,
  Session,
  SubjectKey,
} from "../models/types";
import { genererIdentiteUnique } from "../utils/identity";
import { RNG, clamp, mulberry32, randGauss, randRange } from "../utils/random";

const LETTRES_CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const ELEVES_PAR_CLASSE = 60;

// Distribution réaliste des profils de départ
const DISTRIBUTION_PROFILS: { profil: ProfilType; poids: number }[] = [
  { profil: "scientifique", poids: 0.2 },
  { profil: "litteraire", poids: 0.2 },
  { profil: "equilibre", poids: 0.35 },
  { profil: "difficulte", poids: 0.15 },
  { profil: "irregulier", poids: 0.1 },
];

function tirerProfil(rng: RNG): ProfilType {
  const r = rng();
  let cumul = 0;
  for (const { profil, poids } of DISTRIBUTION_PROFILS) {
    cumul += poids;
    if (r <= cumul) return profil;
  }
  return "equilibre";
}

// Compétences de base selon le profil, avec bruit individuel
function genererCompetences(rng: RNG, profil: ProfilType): ScoresCompetences {
  const base: Record<SubjectKey, number> = {
    mathematiques: 12,
    physique: 12,
    svt: 12,
    francais: 12,
    anglais: 12,
    informatique: 12,
    philosophie: 12,
  };

  switch (profil) {
    case "scientifique":
      base.mathematiques = 16; base.physique = 15; base.informatique = 16;
      base.francais = 11; base.anglais = 13; base.svt = 13;
      break;
    case "litteraire":
      base.francais = 16; base.anglais = 15; base.philosophie = 15;
      base.mathematiques = 10; base.svt = 12; base.physique = 10;
      break;
    case "equilibre":
      base.mathematiques = 14; base.francais = 14; base.physique = 13;
      base.anglais = 13; base.svt = 13; base.informatique = 12;
      break;
    case "difficulte":
      base.mathematiques = 8; base.francais = 9; base.physique = 8;
      base.anglais = 9; base.svt = 9; base.informatique = 9;
      break;
    case "irregulier":
      base.mathematiques = randRange(rng, 8, 17);
      base.francais = randRange(rng, 8, 17);
      base.physique = randRange(rng, 8, 17);
      break;
  }

  const out: Partial<ScoresCompetences> = {};
  (Object.keys(base) as SubjectKey[]).forEach((k) => {
    out[k] = clamp(randGauss(rng, base[k], 1.6), 4, 20);
  });

  out.raisonnementLogique = clamp(
    randGauss(rng, (out.mathematiques! + out.informatique!) / 2, 2),
    4,
    20
  );
  out.communication = clamp(
    randGauss(rng, (out.francais! + out.anglais!) / 2, 2),
    4,
    20
  );
  out.regularite = clamp(randGauss(rng, 60, 20), 10, 100);
  out.progression = 0;

  return out as ScoresCompetences;
}

function genererPotentiel(rng: RNG, profil: ProfilType): PotentielCache {
  let potScientifique = randRange(rng, 20, 80);
  let potLitteraire = randRange(rng, 20, 80);

  if (profil === "scientifique") potScientifique += randRange(rng, 10, 30);
  if (profil === "litteraire") potLitteraire += randRange(rng, 10, 30);
  if (profil === "equilibre") {
    potScientifique += randRange(rng, 0, 10);
    potLitteraire += randRange(rng, 0, 10);
  }
  if (profil === "difficulte") {
    // Le potentiel caché n'est PAS forcément faible : certains élèves en
    // difficulté ont un potentiel élevé mais non exprimé (clé de la
    // divergence de trajectoires demandée).
    if (rng() < 0.25) {
      potScientifique += randRange(rng, 15, 35);
      potLitteraire += randRange(rng, 5, 20);
    }
  }

  return {
    potentielScientifique: clamp(potScientifique, 5, 100),
    potentielLitteraire: clamp(potLitteraire, 5, 100),
    capaciteApprentissage: clamp(randGauss(rng, 0.5, 0.2), 0.15, 0.95),
    resilience: clamp(randGauss(rng, 0.5, 0.2), 0.1, 0.95),
    volatilite:
      profil === "irregulier"
        ? clamp(randGauss(rng, 0.7, 0.15), 0.4, 0.98)
        : clamp(randGauss(rng, 0.3, 0.15), 0.05, 0.8),
  };
}

function genererMatricule(lettreClasse: string, index: number): string {
  return `${lettreClasse}${index}`;
}

export function genererSession(
  seed: number,
  nomSession: string,
  anneeDepart = "2026-2027"
): Session {
  const rng = mulberry32(seed);
  const classes: Classe[] = [];
  const eleves: Record<string, Eleve> = {};
  const identitesUtilisees = new Set<string>();

  LETTRES_CLASSES.forEach((lettre, index) => {
    const classeId = `3e-${index + 1}`;
    const matricules: string[] = [];

    // Exactement 8 élèves internationaux par classe de départ (sur 60),
    // le reste est ivoirien — positions tirées au hasard dans la classe.
    const positionsEtrangers = new Set<number>();
    while (positionsEtrangers.size < 8) {
      positionsEtrangers.add(1 + Math.floor(rng() * ELEVES_PAR_CLASSE));
    }

    for (let i = 1; i <= ELEVES_PAR_CLASSE; i++) {
      const { nom, prenom, pays } = genererIdentiteUnique(rng, identitesUtilisees, positionsEtrangers.has(i));
      const matricule = genererMatricule(lettre, i);
      const profil = tirerProfil(rng);

      const eleve: Eleve = {
        matricule,
        nom,
        prenom,
        pays,
        classeId,
        niveau: "3e",
        statut: "actif",
        profilInitial: profil,
        profilActuel: profil,
        potentiel: genererPotentiel(rng, profil),
        competences: genererCompetences(rng, profil),
        notes: [],
        moyennes: [],
        evenements: [],
        historiqueOrientation: [],
        assiduite: clamp(randGauss(rng, 85, 10), 40, 100),
        redoublements: 0,
        anneesRedoublees: [],
        solde: 0,
        boursier: false,
        historiqueFinancier: [],
      };

      eleves[matricule] = eleve;
      matricules.push(matricule);
    }

    classes.push({
      id: classeId,
      nom: `3e ${index + 1}`,
      niveau: "3e",
      matricules,
      annee: anneeDepart,
    });
  });

  return {
    id: uuid(),
    seed,
    nomSession,
    dateCreation: new Date().toISOString(),
    anneeDepart,
    anneeCourante: { libelle: anneeDepart, trimestreCourant: 1, etapeCourante: "T1" },
    classes,
    eleves,
    evaluations: [],
    historiqueAnnees: [],
    historiqueBilans: [],
    favoris: [],
    concours: [],
  };
}
