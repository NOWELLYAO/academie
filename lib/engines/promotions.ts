import { Eleve, Session } from "../models/types";

export interface EtapeParcours {
  poste: string;
  entreprise: string;
  salaire: number;
  annee: string;
}

/** Résume l'historique de carrière d'un élève en ne gardant que les postes
 * réellement distincts (changement d'intitulé de poste), dans l'ordre
 * chronologique — sans les augmentations annuelles répétitives. */
export function parcoursResume(eleve: Eleve): EtapeParcours[] {
  if (!eleve.carriere) return [];
  const chrono = [...eleve.carriere.historique].reverse();

  const etapes: EtapeParcours[] = [];
  chrono.forEach((h) => {
    const derniere = etapes[etapes.length - 1];
    if (!derniere || derniere.poste !== h.nom || derniere.entreprise !== h.entreprise) {
      etapes.push({ poste: h.nom, entreprise: h.entreprise, salaire: h.salaireMensuel, annee: h.annee });
    } else {
      derniere.salaire = h.salaireMensuel;
    }
  });
  return etapes;
}

/** Liste les années de promotion disponibles (année où au moins un élève a
 * obtenu son diplôme final et démarré sa carrière), triées de la plus
 * récente à la plus ancienne. */
export function listerPromos(session: Session): string[] {
  const annees = new Set<string>();
  Object.values(session.eleves).forEach((e) => {
    if (e.carriere) annees.add(e.carriere.anneeDebut);
  });
  return Array.from(annees).sort().reverse();
}

/** Élèves d'une promo donnée (ceux dont la carrière a démarré cette
 * année-là), triés par salaire actuel décroissant. */
export function elevesDeLaPromo(session: Session, annee: string): Eleve[] {
  return Object.values(session.eleves)
    .filter((e) => e.carriere?.anneeDebut === annee)
    .sort((a, b) => (b.carriere?.salaireMensuel ?? 0) - (a.carriere?.salaireMensuel ?? 0));
}

/** Classe d'origine (3e) d'un élève, retrouvée dans sa toute première
 * entrée de moyennes — conservée même après toutes les recompositions de
 * classes qui ont suivi. */
export function classeOrigine(eleve: Eleve): string {
  return eleve.moyennes[0]?.classeNom ?? "—";
}
