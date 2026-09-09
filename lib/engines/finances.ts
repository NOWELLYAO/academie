import { v4 as uuid } from "uuid";
import { Eleve } from "../models/types";
import { NiveauMention } from "./mentions";

/** Montants en FCFA — cohérents avec le contexte scolaire ouest-africain. */
export const MONTANTS_MENTION: Record<NiveauMention, number> = {
  felicitations: 15000,
  tableau_honneur: 8000,
  encouragements: 3000,
};

export const SEUIL_BOURSE_MERITE = 14; // moyenne annuelle minimale pour être boursier
export const MONTANT_BOURSE_MERITE = 20000; // versé chaque année où le seuil est atteint
export const MONTANT_ADMISSION_EXCELLENCE = 100000; // grande bourse d'excellence post-bac
export const MONTANTS_CONCOURS = [25000, 15000, 10000, 5000, 5000]; // podium (1er → 5e)

const HISTORIQUE_MAX = 15;

/** Crédite un élève d'un montant, avec un motif, en conservant un
 * historique borné (les 15 dernières transactions) pour ne pas alourdir
 * indéfiniment la session. */
export function crediterEleve(
  eleve: Eleve,
  montant: number,
  motif: string,
  annee: string,
  trimestre?: number
): void {
  if (montant <= 0) return;
  eleve.solde = Math.round((eleve.solde ?? 0) + montant);
  if (!eleve.historiqueFinancier) eleve.historiqueFinancier = [];
  eleve.historiqueFinancier.unshift({ id: uuid(), motif, montant, annee, trimestre });
  eleve.historiqueFinancier = eleve.historiqueFinancier.slice(0, HISTORIQUE_MAX);
}

/** Débite un élève (investissement, achat de patrimoine...) — enregistré
 * comme une transaction négative dans le même historique, pour que toutes
 * les actions financières restent visibles au même endroit. */
export function debiterEleve(eleve: Eleve, montant: number, motif: string, annee: string): void {
  if (montant <= 0) return;
  eleve.solde = Math.round((eleve.solde ?? 0) - montant);
  if (!eleve.historiqueFinancier) eleve.historiqueFinancier = [];
  eleve.historiqueFinancier.unshift({ id: uuid(), motif, montant: -montant, annee });
  eleve.historiqueFinancier = eleve.historiqueFinancier.slice(0, HISTORIQUE_MAX);
}

export function formaterFCFA(montant: number): string {
  return `${Math.round(montant).toLocaleString("fr-FR")} FCFA`;
}
