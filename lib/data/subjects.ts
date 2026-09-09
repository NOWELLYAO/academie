import { Matiere, Niveau, SubjectKey } from "../models/types";

export const MATIERES: Matiere[] = [
  {
    key: "mathematiques",
    nom: "Mathématiques",
    coefficientsParNiveau: {
      "3e": 4, "2ndeC": 5, "2ndeA": 2, "1ereC": 6, "1ereD": 5, "1ereA": 1,
      TermC: 7, TermD: 5, TermA: 2,
      PrepaScientifique: 6, DUT: 3, Universite: 2, EcoleIngenieurs: 5,
    },
  },
  {
    key: "physique",
    nom: "Physique",
    coefficientsParNiveau: {
      "3e": 3, "2ndeC": 5, "1ereC": 6, "1ereD": 4, TermC: 6, TermD: 4,
      PrepaScientifique: 5, DUT: 2, EcoleIngenieurs: 4,
    },
  },
  {
    key: "svt",
    nom: "SVT",
    coefficientsParNiveau: {
      "3e": 3, "2ndeC": 2, "1ereD": 6, TermD: 7, Universite: 2,
    },
  },
  {
    key: "francais",
    nom: "Français",
    coefficientsParNiveau: {
      "3e": 4, "2ndeC": 3, "2ndeA": 4, "1ereC": 2, "1ereD": 2, "1ereA": 4,
      TermC: 2, TermD: 2, TermA: 6,
      PrepaLitteraire: 4, Universite: 2,
    },
  },
  {
    key: "anglais",
    nom: "Anglais",
    coefficientsParNiveau: {
      "3e": 2, "2ndeC": 2, "2ndeA": 3, "1ereC": 2, "1ereD": 2, "1ereA": 3,
      TermC: 2, TermD: 1, TermA: 5,
      PrepaScientifique: 1, PrepaLitteraire: 3, DUT: 2, Universite: 2, EcoleIngenieurs: 2,
    },
  },
  {
    key: "informatique",
    nom: "Informatique",
    coefficientsParNiveau: {
      "3e": 2, "2ndeC": 2, "1ereC": 3, "1ereD": 1, TermC: 3, TermD: 1,
      PrepaScientifique: 2, DUT: 4, Universite: 2, EcoleIngenieurs: 5,
    },
  },
  {
    key: "philosophie",
    nom: "Philosophie",
    coefficientsParNiveau: {
      "2ndeA": 5, "1ereA": 5, TermA: 7,
      PrepaLitteraire: 4, Universite: 1,
    },
  },
];

export function matieresDuNiveau(niveau: Niveau): Matiere[] {
  return MATIERES.filter((m) => m.coefficientsParNiveau[niveau] !== undefined);
}

export function coefficient(matiere: SubjectKey, niveau: Niveau): number {
  const m = MATIERES.find((x) => x.key === matiere);
  return m?.coefficientsParNiveau[niveau] ?? 1;
}

export const NOM_NIVEAU: Record<Niveau, string> = {
  "3e": "3e",
  "2ndeC": "Seconde C",
  "2ndeA": "Seconde A",
  "1ereC": "1ère C",
  "1ereD": "1ère D",
  "1ereA": "1ère A",
  TermC: "Terminale C",
  TermD: "Terminale D",
  TermA: "Terminale A",
  PrepaScientifique: "Prépa scientifique (MPSI)",
  PrepaLitteraire: "Prépa littéraire (Hypokhâgne)",
  DUT: "DUT / BTS",
  Universite: "Université",
  EcoleIngenieurs: "École d'ingénieurs",
};

export const LIBELLE_STATUT: Record<string, string> = {
  actif: "Scolarité en cours",
  redoublant: "Redoublant",
  recale: "Recalé — sorti du parcours",
  diplome: "Diplômé",
  universite: "Post-bac en cours",
};

/** Niveaux considérés comme "post-bac" — ont leurs propres classes, matières
 * et notes, exactement comme les niveaux du secondaire, mais avec une durée
 * fixe menant toujours à un diplôme. */
export const NIVEAUX_POST_BAC: Niveau[] = [
  "PrepaScientifique",
  "PrepaLitteraire",
  "DUT",
  "Universite",
  "EcoleIngenieurs",
];

export function estPostBac(niveau: Niveau): boolean {
  return NIVEAUX_POST_BAC.includes(niveau);
}
