import { Eleve, Session } from "../models/types";
import { moyenneCumulee } from "./ranking";

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

/** Toutes les classes suivies par un élève, dans l'ordre chronologique,
 * du tout premier trimestre de 3e jusqu'à sa toute dernière classe
 * connue (Seconde, Première, Terminale, puis post-bac) — sans doublon
 * consécutif (un même nom de classe sur plusieurs trimestres ne compte
 * qu'une fois). */
export function classesSuivies(eleve: Eleve): string[] {
  const noms: string[] = [];
  eleve.moyennes.forEach((m) => {
    if (m.classeNom && noms[noms.length - 1] !== m.classeNom) noms.push(m.classeNom);
  });
  return noms;
}

export interface ClasseHistorique {
  nom: string;
  niveau: string;
  annee: string;
  effectif: number;
}

/** Liste TOUTES les classes ayant existé à un moment ou un autre pendant
 * toute la simulation (secondaire et post-bac confondus), en s'appuyant
 * sur le nom de classe conservé dans chaque entrée de moyenne — puisque
 * session.classes ne contient que les classes de l'année en cours. */
export function listerClassesHistoriques(session: Session): ClasseHistorique[] {
  const registre = new Map<string, ClasseHistorique & { matricules: Set<string> }>();

  Object.values(session.eleves).forEach((eleve) => {
    eleve.moyennes.forEach((m) => {
      if (!m.classeNom) return;
      if (!registre.has(m.classeNom)) {
        registre.set(m.classeNom, {
          nom: m.classeNom,
          niveau: m.niveau,
          annee: m.annee,
          effectif: 0,
          matricules: new Set(),
        });
      }
      registre.get(m.classeNom)!.matricules.add(eleve.matricule);
    });
  });

  return Array.from(registre.values())
    .map(({ matricules, ...rest }) => ({ ...rest, effectif: matricules.size }))
    .sort((a, b) => a.annee.localeCompare(b.annee) || a.nom.localeCompare(b.nom));
}

/** Tous les élèves ayant un jour fait partie d'une classe donnée (par son
 * nom historique), qu'ils y soient encore ou non — triés par moyenne de
 * parcours décroissante. */
export function elevesDeClasseHistorique(session: Session, nomClasse: string): Eleve[] {
  return Object.values(session.eleves)
    .filter((e) => e.moyennes.some((m) => m.classeNom === nomClasse))
    .sort((a, b) => moyenneCumulee(b) - moyenneCumulee(a));
}
