import { Session } from "../models/types";
import { calculerMention, NiveauMention } from "./mentions";

export interface ResultatExamen {
  matricule: string;
  nom: string;
  prenom: string;
  classeNom: string;
  annee: string;
  type: "BEPC" | "Bac";
  serie: string | null; // "C" | "D" | "A" pour le Bac, null pour le BEPC
  points: number;
  pointsMax: number;
  moyenne: number;
  mention: NiveauMention | null;
}

function serieDuNiveau(niveau: string): string | null {
  if (niveau === "TermC") return "C";
  if (niveau === "TermD") return "D";
  if (niveau === "TermA") return "A";
  return null;
}

/** Parcourt tout l'historique de la génération pour en extraire chaque
 * résultat d'examen (BEPC ou Bac) jamais passé — y compris les années
 * précédentes, pas seulement le dernier trimestre de chaque élève. */
export function listerResultatsExamens(session: Session): ResultatExamen[] {
  const resultats: ResultatExamen[] = [];

  Object.values(session.eleves).forEach((eleve) => {
    const nomClasse = session.classes.find((c) => c.id === eleve.classeId)?.nom ?? eleve.classeId;

    eleve.moyennes.forEach((m) => {
      if (!m.pointsExamenMax) return;
      resultats.push({
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        classeNom: m.classeNom ?? nomClasse,
        annee: m.annee,
        type: m.pointsExamenMax === 360 ? "BEPC" : "Bac",
        serie: m.pointsExamenMax === 360 ? null : serieDuNiveau(m.niveau),
        points: m.pointsExamen ?? 0,
        pointsMax: m.pointsExamenMax,
        moyenne: m.moyenneGenerale,
        mention: calculerMention(m.moyenneGenerale),
      });
    });
  });

  return resultats.sort((a, b) => b.points - a.points);
}

export function anneesDisponibles(resultats: ResultatExamen[]): string[] {
  return Array.from(new Set(resultats.map((r) => r.annee))).sort().reverse();
}
