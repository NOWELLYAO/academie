"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EvaluationDef, Session, SubjectKey } from "../models/types";
import { genererSession } from "../engines/generation";
import { etapeSuivante } from "../engines/simulation";
import {
  calculerMoyenneTrimestre,
  creerEvaluation,
  genererNotesAutomatiques,
  saisirNote,
} from "../engines/grading";
import { mulberry32, newSeed } from "../utils/random";
import { construireResumeEtape } from "../engines/resume";

interface AcademyState {
  session: Session | null;
  sessionsHistorique: { id: string; nom: string; dateCreation: string }[];
  dernierResume: string | null;
  nouvelleSession: (nom: string) => void;
  avancerEtape: () => void;
  reinitialiser: () => void;
  creerEvaluationManuelle: (
    classeId: string,
    matiere: SubjectKey,
    type: EvaluationDef["type"],
    bareme: 10 | 20,
    coefficient: number
  ) => string;
  enregistrerNote: (evaluationId: string, matricule: string, valeur: number) => void;
  genererNotesAleatoiresEvaluation: (evaluationId: string) => void;
  toggleFavori: (matricule: string) => void;
}

/** Recalcule et met à jour l'entrée de moyenne trimestrielle d'un élève
 * après une (ou plusieurs) saisie(s) de note, en la créant si besoin. */
function recalculerMoyenneEleve(eleve: Session["eleves"][string], trimestre: 1 | 2 | 3, annee: string) {
  const { parMatiere, moyenneGenerale } = calculerMoyenneTrimestre(eleve, trimestre, annee);
  let entree = eleve.moyennes.find((m) => m.trimestre === trimestre && m.annee === annee);
  if (!entree) {
    entree = {
      trimestre: trimestre as 1 | 2 | 3,
      annee,
      niveau: eleve.niveau,
      parMatiere: [],
      moyenneGenerale: 0,
      rangClasse: 0,
      rangEtablissement: 0,
      rangGeneration: 0,
    };
    eleve.moyennes.push(entree);
  }
  entree.parMatiere = parMatiere;
  entree.moyenneGenerale = moyenneGenerale;
}

function calculerBilan(session: Session) {
  const eleves = Object.values(session.eleves);
  return {
    totalDepart: eleves.length,
    passages: eleves.filter((e) => e.statut === "actif" && e.redoublements === 0).length,
    redoublements: eleves.filter((e) => e.redoublements > 0).length,
    recales: eleves.filter((e) => e.statut === "recale").length,
    diplomes: eleves.filter((e) => e.statut === "universite").length,
    prepaScientifique: eleves.filter((e) => e.niveau === "PrepaScientifique").length,
    prepaLitteraire: eleves.filter((e) => e.niveau === "PrepaLitteraire").length,
    dut: eleves.filter((e) => e.niveau === "DUT").length,
    universitaires: eleves.filter((e) => e.niveau === "Universite").length,
    ecolesIngenieurs: eleves.filter((e) => e.niveau === "EcoleIngenieurs").length,
    admisPolytechnique: eleves.filter((e) => e.admissiblePolytechnique).length,
  };
}

export const useAcademyStore = create<AcademyState>()(
  persist(
    (set, get) => ({
      session: null,
      sessionsHistorique: [],
      dernierResume: null,

      nouvelleSession: (nom: string) => {
        const seed = newSeed();
        const session = genererSession(seed, nom);
        set((state) => ({
          session,
          dernierResume: null,
          sessionsHistorique: [
            { id: session.id, nom: session.nomSession, dateCreation: session.dateCreation },
            ...state.sessionsHistorique,
          ].slice(0, 10),
        }));
      },

      avancerEtape: () => {
        const { session } = get();
        if (!session) return;
        const etapeAvant = session.anneeCourante.etapeCourante;
        const anneeAvant = session.anneeCourante.libelle;
        // Clone profond pour garantir la réactivité de zustand
        const clone: Session = JSON.parse(JSON.stringify(session));
        etapeSuivante(clone);
        clone.bilan = calculerBilan(clone);
        const resume = construireResumeEtape(etapeAvant, anneeAvant, session, clone);
        set({ session: clone, dernierResume: resume });
      },

      reinitialiser: () => set({ session: null }),

      creerEvaluationManuelle: (classeId, matiere, type, bareme, coefficientPropre) => {
        const { session } = get();
        if (!session) return "";
        const clone: Session = JSON.parse(JSON.stringify(session));
        const evaluation = creerEvaluation(
          classeId,
          matiere,
          type,
          bareme,
          coefficientPropre,
          clone.anneeCourante.trimestreCourant,
          clone.anneeCourante.libelle
        );
        clone.evaluations.push(evaluation);
        set({ session: clone });
        return evaluation.id;
      },

      enregistrerNote: (evaluationId, matricule, valeur) => {
        const { session } = get();
        if (!session) return;
        const clone: Session = JSON.parse(JSON.stringify(session));
        const evaluation = clone.evaluations.find((e) => e.id === evaluationId);
        if (!evaluation) return;
        saisirNote(clone, evaluation, matricule, valeur);

        const eleve = clone.eleves[matricule];
        if (eleve) recalculerMoyenneEleve(eleve, evaluation.trimestre, evaluation.annee);

        set({ session: clone });
      },

      genererNotesAleatoiresEvaluation: (evaluationId: string) => {
        const { session } = get();
        if (!session) return;
        const clone: Session = JSON.parse(JSON.stringify(session));
        const evaluation = clone.evaluations.find((e) => e.id === evaluationId);
        if (!evaluation) return;
        const classe = clone.classes.find((c) => c.id === evaluation.classeId);
        if (!classe) return;

        const rng = mulberry32(Math.floor(Math.random() * 2 ** 31));
        genererNotesAutomatiques(rng, clone, evaluation, classe);

        classe.matricules.forEach((matricule) => {
          const eleve = clone.eleves[matricule];
          if (eleve) recalculerMoyenneEleve(eleve, evaluation.trimestre, evaluation.annee);
        });

        set({ session: clone });
      },

      toggleFavori: (matricule: string) => {
        const { session } = get();
        if (!session) return;
        const clone: Session = JSON.parse(JSON.stringify(session));
        if (!clone.favoris) clone.favoris = [];
        const idx = clone.favoris.indexOf(matricule);
        if (idx === -1) clone.favoris.push(matricule);
        else clone.favoris.splice(idx, 1);
        set({ session: clone });
      },
    }),
    {
      name: "academie-session-storage",
    }
  )
);
