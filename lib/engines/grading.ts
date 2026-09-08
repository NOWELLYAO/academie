import { v4 as uuid } from "uuid";
import {
  Classe,
  Eleve,
  EvaluationDef,
  MoyenneMatiere,
  Note,
  Session,
  SubjectKey,
} from "../models/types";
import { coefficient, matieresDuNiveau } from "../data/subjects";
import { mettreAJourCompetence, mettreAJourRegularite } from "./progression";
import { genererNoteBrute } from "./potential";
import { RNG } from "../utils/random";

export function convertirSur20(valeur: number, bareme: 10 | 20): number {
  return bareme === 10 ? valeur * 2 : valeur;
}

export function creerEvaluation(
  classeId: string,
  matiere: SubjectKey,
  type: Note["type"],
  bareme: 10 | 20,
  coefficientPropre: number,
  trimestre: 1 | 2 | 3,
  annee: string,
  date: string = new Date().toISOString().slice(0, 10)
): EvaluationDef {
  return {
    id: uuid(),
    classeId,
    matiere,
    type,
    date,
    bareme,
    coefficient: coefficientPropre,
    trimestre,
    annee,
    saisies: {},
  };
}

/** Saisit ou modifie la note d'un élève pour une évaluation, et met à jour
 * en cascade sa compétence (moteur de progression). */
export function saisirNote(
  session: Session,
  evaluation: EvaluationDef,
  matricule: string,
  valeurBrute: number
): void {
  evaluation.saisies[matricule] = valeurBrute;
  const eleve = session.eleves[matricule];
  if (!eleve) return;

  const valeurSur20 = convertirSur20(valeurBrute, evaluation.bareme);

  const noteExistante = eleve.notes.find(
    (n) =>
      n.matiere === evaluation.matiere &&
      n.type === evaluation.type &&
      n.date === evaluation.date &&
      n.trimestre === evaluation.trimestre &&
      n.annee === evaluation.annee
  );

  if (noteExistante) {
    noteExistante.valeur = valeurBrute;
    noteExistante.valeurSur20 = valeurSur20;
  } else {
    const note: Note = {
      id: uuid(),
      matiere: evaluation.matiere,
      type: evaluation.type,
      bareme: evaluation.bareme,
      valeur: valeurBrute,
      valeurSur20,
      coefficient: evaluation.coefficient,
      date: evaluation.date,
      trimestre: evaluation.trimestre,
      annee: evaluation.annee,
      niveau: eleve.niveau,
    };
    eleve.notes.push(note);
  }

  mettreAJourCompetence(eleve, evaluation.matiere, valeurSur20);
  mettreAJourRegularite(eleve);
}

/** Génère automatiquement les notes d'une évaluation pour toute une classe
 * (utilisé quand le joueur ne saisit pas manuellement chaque note). */
export function genererNotesAutomatiques(
  rng: RNG,
  session: Session,
  evaluation: EvaluationDef,
  classe: Classe
): void {
  classe.matricules.forEach((matricule) => {
    const eleve = session.eleves[matricule];
    if (!eleve) return;
    const noteSur20 = genererNoteBrute(rng, eleve, evaluation.matiere);
    const valeurBrute =
      evaluation.bareme === 10 ? Math.round((noteSur20 / 2) * 10) / 10 : noteSur20;
    saisirNote(session, evaluation, matricule, valeurBrute);
  });
}

/** Calcule la moyenne d'un élève dans une matière pour un trimestre/année donnés. */
export function moyenneMatiereEleve(
  eleve: Eleve,
  matiere: SubjectKey,
  trimestre: number,
  annee: string
): number | null {
  const notes = eleve.notes.filter(
    (n) => n.matiere === matiere && n.trimestre === trimestre && n.annee === annee
  );
  if (notes.length === 0) return null;

  const totalPonderé = notes.reduce((acc, n) => acc + n.valeurSur20 * n.coefficient, 0);
  const totalCoeff = notes.reduce((acc, n) => acc + n.coefficient, 0);
  return totalCoeff > 0 ? Math.round((totalPonderé / totalCoeff) * 100) / 100 : null;
}

/** Calcule la moyenne générale pondérée par les coefficients de matières. */
export function calculerMoyenneTrimestre(
  eleve: Eleve,
  trimestre: 1 | 2 | 3,
  annee: string
): { parMatiere: MoyenneMatiere[]; moyenneGenerale: number } {
  const matieres = matieresDuNiveau(eleve.niveau);
  const parMatiere: MoyenneMatiere[] = [];
  let totalPondere = 0;
  let totalCoeff = 0;

  matieres.forEach((m) => {
    const moy = moyenneMatiereEleve(eleve, m.key, trimestre, annee);
    const coeff = coefficient(m.key, eleve.niveau);
    if (moy !== null) {
      parMatiere.push({ matiere: m.key, moyenne: moy, coefficient: coeff });
      totalPondere += moy * coeff;
      totalCoeff += coeff;
    }
  });

  const moyenneGenerale =
    totalCoeff > 0 ? Math.round((totalPondere / totalCoeff) * 100) / 100 : 0;

  return { parMatiere, moyenneGenerale };
}
