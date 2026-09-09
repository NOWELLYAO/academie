import { Eleve } from "../models/types";
import { RNG, pick } from "../utils/random";

export const SPECIALITES_INGENIEUR = [
  "Mécanique",
  "Télécom",
  "Énergétique",
  "Génie électrique",
  "Informatique",
  "Biochimie",
  "Généraliste",
] as const;

export type SpecialiteIngenieur = (typeof SPECIALITES_INGENIEUR)[number];

/** Attribue une spécialité d'école d'ingénieurs à l'issue du concours,
 * selon le profil de compétences de l'élève et son origine (Prépa Bio,
 * Prépa Génie Civil, ou Prépa scientifique classique). */
export function choisirSpecialiteIngenieur(eleve: Eleve, rng: RNG, origine: string): SpecialiteIngenieur {
  const c = eleve.competences;

  if (origine === "PrepaBio") {
    return c.svt >= 15 ? "Biochimie" : "Généraliste";
  }
  if (origine === "PrepaGenieCivil") {
    return "Mécanique";
  }

  const candidats: SpecialiteIngenieur[] = [];
  if (c.informatique >= 15) candidats.push("Informatique", "Télécom");
  if (c.physique >= 15 && c.mathematiques >= 15) candidats.push("Énergétique", "Génie électrique", "Mécanique");
  if (c.svt >= 14) candidats.push("Biochimie");
  if (candidats.length === 0) candidats.push("Généraliste");

  return pick(rng, candidats);
}
