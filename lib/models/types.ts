// ============================================================
// MODÈLES DE DONNÉES — Académie : Génération
// ============================================================

export type ProfilType =
  | "scientifique"
  | "litteraire"
  | "equilibre"
  | "difficulte"
  | "irregulier";

export type Niveau =
  | "3e"
  | "2ndeC"
  | "2ndeA"
  | "1ereC"
  | "1ereD"
  | "1ereA"
  | "TermC"
  | "TermD"
  | "TermA"
  | "Universite"
  | "EcoleIngenieurs";

export const ORDRE_NIVEAUX: Niveau[] = [
  "3e",
  "2ndeC",
  "2ndeA",
  "1ereC",
  "1ereD",
  "1ereA",
  "TermC",
  "TermD",
  "TermA",
];

export type Statut =
  | "actif"
  | "redoublant"
  | "recale"
  | "diplome"
  | "universite";

export type SubjectKey =
  | "mathematiques"
  | "physique"
  | "svt"
  | "francais"
  | "anglais"
  | "informatique"
  | "philosophie";

export interface PotentielCache {
  potentielScientifique: number; // 0-100
  potentielLitteraire: number; // 0-100
  capaciteApprentissage: number; // 0-1, vitesse de progression
  resilience: number; // 0-1, capacité à rebondir
  volatilite: number; // 0-1, amplitude du bruit sur les notes
}

export type ScoresCompetences = Record<SubjectKey, number> & {
  raisonnementLogique: number;
  communication: number;
  regularite: number;
  progression: number; // dérivé, calculé
};

export interface Note {
  id: string;
  matiere: SubjectKey;
  type:
    | "devoir"
    | "interrogation"
    | "controle"
    | "examen"
    | "projet"
    | "tp"
    | "surprise";
  bareme: 10 | 20;
  valeur: number;
  valeurSur20: number;
  coefficient: number;
  date: string;
  trimestre: 1 | 2 | 3;
  annee: string;
  niveau: Niveau;
}

export interface MoyenneMatiere {
  matiere: SubjectKey;
  moyenne: number;
  coefficient: number;
}

export interface MoyenneTrimestre {
  trimestre: 1 | 2 | 3;
  annee: string;
  niveau: Niveau;
  parMatiere: MoyenneMatiere[];
  moyenneGenerale: number;
  rangClasse: number;
  rangEtablissement: number;
  rangGeneration: number;
}

export interface EvenementScolaire {
  id: string;
  type:
    | "progression_exceptionnelle"
    | "baisse_niveau"
    | "changement_profil"
    | "declic"
    | "irregularite";
  matiereConcernee?: SubjectKey;
  trimestre: number;
  annee: string;
  niveau: Niveau;
  description: string;
  impact: { competence: string; delta: number }[];
}

export interface OrientationEntry {
  annee: string;
  niveauOrigine: Niveau;
  niveauDestination: Niveau | "recale" | "diplome" | "redoublement";
  motif: string;
  scoreDetail: Record<string, number>;
}

export interface Eleve {
  matricule: string;
  nom: string;
  prenom: string;
  pays: string;
  classeId: string;
  niveau: Niveau;
  statut: Statut;
  profilInitial: ProfilType;
  profilActuel: ProfilType;
  potentiel: PotentielCache;
  competences: ScoresCompetences;
  notes: Note[];
  moyennes: MoyenneTrimestre[];
  evenements: EvenementScolaire[];
  historiqueOrientation: OrientationEntry[];
  assiduite: number; // 0-100
  redoublements: number;
  admissiblePolytechnique?: boolean;
  anneesRedoublees: string[];
}

export interface Classe {
  id: string; // ex: "3e-A"
  nom: string; // ex: "3e A"
  niveau: Niveau;
  matricules: string[]; // élèves de la classe
  annee: string;
}

export interface Matiere {
  key: SubjectKey;
  nom: string;
  coefficientsParNiveau: Partial<Record<Niveau, number>>;
}

export interface EvaluationDef {
  id: string;
  classeId: string;
  matiere: SubjectKey;
  type: Note["type"];
  date: string;
  bareme: 10 | 20;
  coefficient: number;
  trimestre: 1 | 2 | 3;
  annee: string;
  saisies: Record<string, number | null>; // matricule -> note brute
}

export interface AnneeScolaireInfo {
  libelle: string; // "2026-2027"
  trimestreCourant: 1 | 2 | 3;
  etapeCourante:
    | "T1"
    | "T2"
    | "T3"
    | "examen"
    | "orientation"
    | "annee_suivante";
}

export interface Session {
  id: string;
  seed: number;
  nomSession: string;
  dateCreation: string;
  anneeDepart: string;
  anneeCourante: AnneeScolaireInfo;
  classes: Classe[];
  eleves: Record<string, Eleve>; // matricule -> eleve
  evaluations: EvaluationDef[];
  historiqueAnnees: string[]; // années déjà simulées
  favoris: string[]; // matricules des élèves marqués comme favoris
  bilan?: BilanGeneration;
}

export interface BilanGeneration {
  totalDepart: number;
  passages: number;
  redoublements: number;
  recales: number;
  diplomes: number;
  universitaires: number;
  ecolesIngenieurs: number;
  admisPolytechnique: number;
}
