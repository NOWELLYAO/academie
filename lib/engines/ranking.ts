import { Eleve, Session, SubjectKey } from "../models/types";

export interface EntreeClassement {
  matricule: string;
  nom: string;
  prenom: string;
  classeId: string;
  classeNom: string;
  moyenne: number;
  rang: number;
}

function carteNomsClasses(session: Session): Record<string, string> {
  const carte: Record<string, string> = {};
  session.classes.forEach((c) => (carte[c.id] = c.nom));
  return carte;
}

export function classerEleves(eleves: Eleve[], nomsClasses: Record<string, string> = {}): EntreeClassement[] {
  const avecMoyenne = eleves
    .map((e) => {
      const derniere = e.moyennes[e.moyennes.length - 1];
      return {
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        classeId: e.classeId,
        classeNom: nomsClasses[e.classeId] ?? e.classeId,
        moyenne: derniere?.moyenneGenerale ?? 0,
      };
    })
    .sort((a, b) => b.moyenne - a.moyenne);

  return avecMoyenne.map((e, i) => ({ ...e, rang: i + 1 }));
}

export function classerClasse(session: Session, classeId: string): EntreeClassement[] {
  const classe = session.classes.find((c) => c.id === classeId);
  if (!classe) return [];
  const eleves = classe.matricules.map((m) => session.eleves[m]).filter(Boolean);
  return classerEleves(eleves, carteNomsClasses(session));
}

export function classerGeneration(session: Session): EntreeClassement[] {
  return classerEleves(Object.values(session.eleves), carteNomsClasses(session));
}

export function moyenneCumulee(eleve: Eleve): number {
  if (eleve.moyennes.length === 0) return 0;
  const total = eleve.moyennes.reduce((acc, m) => acc + m.moyenneGenerale, 0);
  return Math.round((total / eleve.moyennes.length) * 100) / 100;
}

export function hallOfFame(session: Session, top = 20): (EntreeClassement & { moyenneCumulee: number })[] {
  const eleves = Object.values(session.eleves);
  const nomsClasses = carteNomsClasses(session);
  return eleves
    .map((e) => ({
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      classeId: e.classeId,
      classeNom: nomsClasses[e.classeId] ?? e.classeId,
      moyenne: e.moyennes[e.moyennes.length - 1]?.moyenneGenerale ?? 0,
      moyenneCumulee: moyenneCumulee(e),
      rang: 0,
    }))
    .sort((a, b) => b.moyenneCumulee - a.moyenneCumulee)
    .slice(0, top)
    .map((e, i) => ({ ...e, rang: i + 1 }));
}

/** Dernière moyenne enregistrée pour un élève dans une matière donnée
 * (issue du dernier trimestre calculé), ou null si la matière ne concerne
 * pas son niveau ou qu'aucune note n'a encore été saisie. */
export function derniereMoyenneMatiere(eleve: Eleve, matiere: SubjectKey): number | null {
  const derniere = eleve.moyennes[eleve.moyennes.length - 1];
  if (!derniere) return null;
  const entree = derniere.parMatiere.find((m) => m.matiere === matiere);
  return entree ? entree.moyenne : null;
}

/** Classement trié (avec rang) des élèves d'un ensemble donné pour une matière précise. */
export function classerParMatiereListe(
  session: Session,
  eleves: Eleve[],
  matiere: SubjectKey
): EntreeClassement[] {
  const nomsClasses = carteNomsClasses(session);
  const avecNote = eleves
    .map((e) => ({
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      classeId: e.classeId,
      classeNom: nomsClasses[e.classeId] ?? e.classeId,
      moyenne: derniereMoyenneMatiere(e, matiere),
    }))
    .filter((e): e is EntreeClassement & { moyenne: number } => e.moyenne !== null)
    .sort((a, b) => b.moyenne - a.moyenne);

  return avecNote.map((e, i) => ({ ...e, rang: i + 1 }));
}
/** Classement des élèves d'un ensemble donné (classe ou génération) pour
 * une matière précise, avec le rang de chacun. Les élèves sans note dans
 * cette matière (autre filière/niveau) n'apparaissent pas dans le classement
 * mais peuvent être retrouvés via la map de retour. */
export function classerParMatiere(
  eleves: Eleve[],
  matiere: SubjectKey
): Map<string, { moyenne: number; rang: number; total: number }> {
  const avecNote = eleves
    .map((e) => ({ matricule: e.matricule, moyenne: derniereMoyenneMatiere(e, matiere) }))
    .filter((e): e is { matricule: string; moyenne: number } => e.moyenne !== null)
    .sort((a, b) => b.moyenne - a.moyenne);

  const carte = new Map<string, { moyenne: number; rang: number; total: number }>();
  avecNote.forEach((e, i) => {
    carte.set(e.matricule, { moyenne: e.moyenne, rang: i + 1, total: avecNote.length });
  });
  return carte;
}
