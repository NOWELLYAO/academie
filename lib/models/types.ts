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
  | "PrepaScientifique"
  | "PrepaBio"
  | "PrepaGenieCivil"
  | "PrepaCommerce"
  | "PrepaLitteraire"
  | "DUT"
  | "Universite"
  | "EcoleIngenieurs"
  | "EcoleCommerce";

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
  "EcoleIngenieurs",
  "EcoleCommerce",
  "PrepaScientifique",
  "PrepaBio",
  "PrepaGenieCivil",
  "PrepaCommerce",
  "PrepaLitteraire",
  "DUT",
  "Universite",
];

export type Statut =
  | "actif"
  | "redoublant"
  | "recale"
  | "diplome"
  | "universite"
  | "retraite";

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
  noteExamen?: number;
}

export interface MoyenneTrimestre {
  trimestre: 1 | 2 | 3;
  annee: string;
  niveau: Niveau;
  classeId: string;
  classeNom: string;
  parMatiere: MoyenneMatiere[];
  moyenneGenerale: number;
  rangClasse: number;
  rangEtablissement: number;
  rangGeneration: number;
  examenTraite?: boolean;
  pointsExamen?: number;
  pointsExamenMax?: number;
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
  solde: number;
  boursier: boolean;
  historiqueFinancier: TransactionFinanciere[];
  anneePostBac?: number; // année en cours dans le cursus post-bac actuel (1, 2, 3...)
  orientationAnneeTraitee?: string; // année déjà traitée à l'étape Orientation (idempotence)
  carriere?: Carriere;
  marie?: boolean;
  conjointMatricule?: string;
  anneeMariage?: string;
  serieBac?: "A" | "C" | "D";
  specialiteIngenieur?: string;
  bourse?: PortefeuilleBourse;
  patrimoine?: ActifPatrimoine[];
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

export interface EtapeCarriere {
  annee: string;
  metierId: string;
  nom: string;
  entreprise: string;
  secteur: string;
  niveauResponsabilite: number;
  salaireMensuel: number;
  motif: string;
}

export interface Carriere {
  metierId: string;
  nom: string;
  entreprise: string;
  secteur: string;
  niveauResponsabilite: number;
  salaireMensuel: number;
  anneeDebut: string;
  historique: EtapeCarriere[];
  typeCarriere: "salarie" | "entrepreneur";
  statutEntreprise?: "en_activite" | "faillite" | "succes";
  paysExpatriation?: string;
}

export interface ActifPatrimoine {
  id: string;
  type: "voiture" | "maison" | "terrain" | "bijoux" | "autre";
  nom: string;
  valeurAchat: number;
  anneeAchat: string;
}

export interface EtapeBourse {
  annee: string;
  action: "achat" | "vente" | "performance";
  montant: number;
  motif: string;
}

export interface PortefeuilleBourse {
  valeur: number;
  historique: EtapeBourse[];
}

export interface TransactionFinanciere {
  id: string;
  motif: string;
  montant: number;
  annee: string;
  trimestre?: number;
}

export interface ResultatConcours {
  id: string;
  nom: string;
  domaine: "scientifique" | "litteraire" | "technologique" | "naturaliste" | "generale";
  niveauLibelle: string; // ex: "Toute la génération", "Terminale"
  annee: string;
  podium: { matricule: string; nom: string; prenom: string; score: number; rang: number }[];
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
  historiqueBilans: SnapshotAnnee[]; // évolution de la génération, année par année
  favoris: string[]; // matricules des élèves marqués comme favoris
  concours: ResultatConcours[];
  bilan?: BilanGeneration;
}

export interface BilanGeneration {
  totalDepart: number;
  passages: number;
  redoublements: number;
  recales: number;
  diplomes: number;
  retraites: number;
  enPostBac: number;
  prepaScientifique: number;
  prepaLitteraire: number;
  dut: number;
  universitaires: number;
  ecolesIngenieurs: number;
  admisPolytechnique: number;
}

/** Photographie de la génération à la fin d'une année scolaire (après
 * orientation), pour pouvoir tracer son évolution dans le temps. */
export interface SnapshotAnnee {
  annee: string;
  repartitionNiveaux: Partial<Record<Niveau, number>>;
  moyenneGenerale: number;
  tauxReussite: number;
  passages: number;
  redoublements: number;
  recales: number;
  prepaScientifique: number;
  prepaLitteraire: number;
  dut: number;
  universitaires: number;
  ecolesIngenieurs: number;
  admissionExcellence: number;
}
