import { Eleve, Session } from "../models/types";

export interface EntreeClassement {
  matricule: string;
  nom: string;
  prenom: string;
  classeId: string;
  moyenne: number;
  rang: number;
}

export function classerEleves(eleves: Eleve[]): EntreeClassement[] {
  const avecMoyenne = eleves
    .map((e) => {
      const derniere = e.moyennes[e.moyennes.length - 1];
      return {
        matricule: e.matricule,
        nom: e.nom,
        prenom: e.prenom,
        classeId: e.classeId,
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
  return classerEleves(eleves);
}

export function classerGeneration(session: Session): EntreeClassement[] {
  return classerEleves(Object.values(session.eleves));
}

export function moyenneCumulee(eleve: Eleve): number {
  if (eleve.moyennes.length === 0) return 0;
  const total = eleve.moyennes.reduce((acc, m) => acc + m.moyenneGenerale, 0);
  return Math.round((total / eleve.moyennes.length) * 100) / 100;
}

export function hallOfFame(session: Session, top = 20): (EntreeClassement & { moyenneCumulee: number })[] {
  const eleves = Object.values(session.eleves);
  return eleves
    .map((e) => ({
      matricule: e.matricule,
      nom: e.nom,
      prenom: e.prenom,
      classeId: e.classeId,
      moyenne: e.moyennes[e.moyennes.length - 1]?.moyenneGenerale ?? 0,
      moyenneCumulee: moyenneCumulee(e),
      rang: 0,
    }))
    .sort((a, b) => b.moyenneCumulee - a.moyenneCumulee)
    .slice(0, top)
    .map((e, i) => ({ ...e, rang: i + 1 }));
}
