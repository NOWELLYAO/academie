import { Eleve } from "../models/types";
import { RNG, pick } from "../utils/random";

export const SPECIALITES_INGENIEUR = [
  "Mécanique",
  "Télécom",
  "Énergétique",
  "Génie électrique",
  "Informatique",
  "Biochimie",
  "Génie Civil",
  "Mines",
  "Sciences de l'Eau",
  "Ingénieur commercial",
  "Finance",
] as const;

export type SpecialiteIngenieur = (typeof SPECIALITES_INGENIEUR)[number];

const SPECIALITES_TECHNO: SpecialiteIngenieur[] = [
  "Mécanique",
  "Télécom",
  "Énergétique",
  "Génie électrique",
  "Informatique",
];

/** Attribue une spécialité d'école d'ingénieurs à l'issue du concours
 * GBINZIN (ou de la sélection des 5 meilleurs de chaque filière DUT),
 * selon l'origine de l'élève. Ingénieur commercial et Finance sont
 * exclusivement réservées aux élèves venus de Prépa Commerce — aucune
 * autre origine n'y a accès. */
export function choisirSpecialiteIngenieur(eleve: Eleve, rng: RNG, origine: string): SpecialiteIngenieur {
  const c = eleve.competences;

  if (origine === "PrepaBio") return "Biochimie";
  if (origine === "PrepaGenieCivil") return pick(rng, ["Génie Civil", "Mines", "Sciences de l'Eau"]);
  if (origine === "PrepaCommerce") return pick(rng, ["Ingénieur commercial", "Finance"]);

  const candidats: SpecialiteIngenieur[] = [];
  if (c.informatique >= 15) candidats.push("Informatique", "Télécom");
  if (c.physique >= 15 && c.mathematiques >= 15) candidats.push("Énergétique", "Génie électrique", "Mécanique");
  if (candidats.length === 0) candidats.push(...SPECIALITES_TECHNO);

  return pick(rng, candidats);
}
