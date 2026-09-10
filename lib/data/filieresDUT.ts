import { Eleve } from "../models/types";
import { RNG, pick } from "../utils/random";

export const FILIERES_DUT = [
  "Gestion commerciale",
  "Finances & Comptabilité",
  "Électromécanique",
  "Électrotechnique",
  "Informatique et Télécom",
  "Énergie",
  "Chimie Industrielle",
] as const;

export type FiliereDUT = (typeof FILIERES_DUT)[number];

/** Filières DUT techniques (débouchant potentiellement, pour les 5
 * meilleurs de la filière, sur les classes d'ingénieurs) — Gestion
 * commerciale et Finances & Comptabilité n'y donnent jamais accès : seuls
 * les élèves de Prépa Commerce accèdent aux spécialités Ingénieur
 * commercial / Finance. */
export const FILIERES_DUT_TECHNIQUES: FiliereDUT[] = [
  "Électromécanique",
  "Électrotechnique",
  "Informatique et Télécom",
  "Énergie",
  "Chimie Industrielle",
];

/** Choisit une filière DUT à l'entrée, selon des critères précis par
 * matière (voir fiche d'admissibilité). Repli aléatoire si aucun critère
 * n'est atteint — jamais de blocage. */
export function choisirFiliereDUT(eleve: Eleve, rng: RNG): FiliereDUT {
  const c = eleve.competences;
  const eligibles: FiliereDUT[] = [];

  if (c.francais >= 14 && c.anglais >= 13) eligibles.push("Gestion commerciale");
  if (c.mathematiques >= 13 && c.informatique >= 13) eligibles.push("Finances & Comptabilité");
  if (c.physique >= 14 && c.mathematiques >= 14) eligibles.push("Électromécanique");
  if (c.physique >= 15 && c.mathematiques >= 14) eligibles.push("Électrotechnique");
  if (c.informatique >= 15 && c.mathematiques >= 13) eligibles.push("Informatique et Télécom");
  if (c.physique >= 14 && c.mathematiques >= 14) eligibles.push("Énergie");
  if (c.svt >= 14 && c.mathematiques >= 12 && c.physique >= 14) eligibles.push("Chimie Industrielle");

  if (eligibles.length > 0) return pick(rng, eligibles);
  return pick(rng, [...FILIERES_DUT]);
}

/** Spécialité d'école d'ingénieurs correspondant à une filière DUT
 * technique, pour les 5 meilleurs de chaque promotion. */
export function specialiteDepuisFiliereDUT(filiere: string, rng: RNG): string {
  switch (filiere) {
    case "Électromécanique":
      return "Mécanique";
    case "Électrotechnique":
      return "Génie électrique";
    case "Informatique et Télécom":
      return pick(rng, ["Informatique", "Télécom"]);
    case "Énergie":
      return "Énergétique";
    case "Chimie Industrielle":
      return "Biochimie";
    default:
      return "Généraliste";
  }
}
