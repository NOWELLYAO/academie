import { Session, Niveau } from "../models/types";
import { calculerMention, NiveauMention } from "./mentions";

export interface ResultatExamen {
  matricule: string;
  nom: string;
  prenom: string;
  classeNom: string;
  annee: string;
  type: string; // "BEPC", "Bac", "Session Prépa scientifique", etc.
  serie: string | null; // "C" | "D" | "A" pour le Bac uniquement
  points: number;
  pointsMax: number;
  moyenne: number;
  mention: NiveauMention | null;
}

const TYPE_PAR_NIVEAU: Partial<Record<Niveau, string>> = {
  "3e": "BEPC",
  TermA: "Bac",
  TermC: "Bac",
  TermD: "Bac",
  PrepaScientifique: "Session Prépa scientifique",
  PrepaBio: "Session Prépa Bio",
  PrepaGenieCivil: "Session Prépa Génie Civil",
  PrepaCommerce: "Session Prépa Commerce",
  PrepaLitteraire: "Session Prépa littéraire",
  DUT: "Session DUT/BTS",
  Universite: "Session Université",
  EcoleIngenieurs: "Session École d'ingénieurs",
  EcoleCommerce: "Session École de commerce",
};

function serieDuNiveau(niveau: string): string | null {
  if (niveau === "TermC") return "C";
  if (niveau === "TermD") return "D";
  if (niveau === "TermA") return "A";
  return null;
}

/** Parcourt tout l'historique de la génération pour en extraire chaque
 * résultat d'examen ou de session (BEPC, Bac, ou sessions post-bac) jamais
 * passé — y compris les années précédentes, pas seulement le dernier
 * trimestre de chaque élève. */
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
        type: TYPE_PAR_NIVEAU[m.niveau] ?? "Session",
        serie: serieDuNiveau(m.niveau),
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

export function typesDisponibles(resultats: ResultatExamen[]): string[] {
  const ordre = [
    "BEPC",
    "Bac",
    "Session Prépa scientifique",
    "Session Prépa Bio",
    "Session Prépa Génie Civil",
    "Session Prépa Commerce",
    "Session Prépa littéraire",
    "Session DUT/BTS",
    "Session Université",
    "Session École d'ingénieurs",
    "Session École de commerce",
  ];
  const presents = new Set(resultats.map((r) => r.type));
  return ordre.filter((t) => presents.has(t));
}
