import { Matiere, Niveau, SubjectKey } from "../models/types";

export const MATIERES: Matiere[] = [
  {
    key: "mathematiques",
    nom: "Mathématiques",
    coefficientsParNiveau: {
      "3e": 3, "2ndeC": 5, "2ndeA": 2, "1ereC": 6, "1ereD": 5, "1ereA": 1,
      TermC: 7, TermD: 6, TermA: 1,
    },
  },
  {
    key: "physique",
    nom: "Physique",
    coefficientsParNiveau: {
      "3e": 3, "2ndeC": 5, "1ereC": 6, "1ereD": 4, TermC: 6, TermD: 4,
    },
  },
  {
    key: "svt",
    nom: "SVT",
    coefficientsParNiveau: {
      "3e": 2, "2ndeC": 2, "1ereD": 6, TermD: 7,
    },
  },
  {
    key: "francais",
    nom: "Français",
    coefficientsParNiveau: {
      "3e": 3, "2ndeC": 3, "2ndeA": 4, "1ereC": 2, "1ereD": 2, "1ereA": 4,
      TermC: 2, TermD: 2, TermA: 4,
    },
  },
  {
    key: "anglais",
    nom: "Anglais",
    coefficientsParNiveau: {
      "3e": 2, "2ndeC": 2, "2ndeA": 3, "1ereC": 2, "1ereD": 2, "1ereA": 3,
      TermC: 2, TermD: 2, TermA: 3,
    },
  },
  {
    key: "informatique",
    nom: "Informatique",
    coefficientsParNiveau: {
      "3e": 2, "2ndeC": 2, "1ereC": 3, "1ereD": 1, TermC: 3, TermD: 1,
    },
  },
  {
    key: "philosophie",
    nom: "Philosophie",
    coefficientsParNiveau: {
      "2ndeA": 5, "1ereA": 5, TermA: 6,
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
  PrepaScientifique: "Classe préparatoire scientifique",
  PrepaLitteraire: "Classe préparatoire littéraire",
  DUT: "DUT / BTS",
  Universite: "Université",
  EcoleIngenieurs: "École d'ingénieurs",
};
