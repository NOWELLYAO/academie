import { Eleve } from "../models/types";

export type Domaine = "scientifique" | "litteraire" | "technologique" | "naturaliste";

export const LIBELLE_DOMAINE: Record<Domaine, string> = {
  scientifique: "Scientifiques",
  litteraire: "Littéraires",
  technologique: "Technologiques",
  naturaliste: "Naturalistes",
};

export interface ScoresDomaines {
  scientifique: number;
  litteraire: number;
  technologique: number;
  naturaliste: number;
}

/** Calcule un score par grand domaine de talent, indépendamment de la
 * série officielle de l'élève — utile pour repérer les "génies" et
 * "inventeurs" même hors de la filière scientifique classique. */
export function scoreDomaines(eleve: Eleve): ScoresDomaines {
  const c = eleve.competences;
  return {
    scientifique: Math.round((c.mathematiques * 0.6 + c.physique * 0.4) * 10) / 10,
    litteraire: Math.round((c.francais * 0.5 + c.anglais * 0.3 + (c.philosophie ?? 10) * 0.2) * 10) / 10,
    technologique: Math.round((c.informatique * 0.6 + c.raisonnementLogique * 0.4) * 10) / 10,
    naturaliste: Math.round(c.svt * 10) / 10,
  };
}

export function scoreDuDomaine(eleve: Eleve, domaine: Domaine): number {
  return scoreDomaines(eleve)[domaine];
}
