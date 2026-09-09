"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EvaluationDef, Session, SubjectKey } from "../models/types";
import { genererSession } from "../engines/generation";
import { etapeSuivante, genererNotesPourNiveau } from "../engines/simulation";
import {
  calculerMoyenneTrimestre,
  creerEvaluation,
  genererNotesAutomatiques,
  saisirNote,
} from "../engines/grading";
import { mulberry32, newSeed } from "../utils/random";
import { construireResumeEtape } from "../engines/resume";
import { scoreDuDomaine } from "../engines/domaines";
import { crediterEleve, MONTANTS_CONCOURS, MONTANT_ADMISSION_EXCELLENCE } from "../engines/finances";
import { v4 as uuid } from "uuid";

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
  lancerConcours: (
    nom: string,
    domaine: "scientifique" | "litteraire" | "technologique" | "naturaliste" | "generale",
    niveaux: string[] | null,
    niveauLibelle: string,
    prestige?: boolean
  ) => void;
  genererNotesPourNiveau: (groupeCle: string) => number;
}

/** Recalcule et met à jour l'entrée de moyenne trimestrielle d'un élève
 * après une (ou plusieurs) saisie(s) de note, en la créant si besoin. */
function recalculerMoyenneEleve(
  session: Session,
  eleve: Session["eleves"][string],
  trimestre: 1 | 2 | 3,
  annee: string
) {
  const { parMatiere, moyenneGenerale } = calculerMoyenneTrimestre(eleve, trimestre, annee);
  let entree = eleve.moyennes.find((m) => m.trimestre === trimestre && m.annee === annee);
  if (!entree) {
    const classeActuelle = session.classes.find((c) => c.id === eleve.classeId);
    entree = {
      trimestre: trimestre as 1 | 2 | 3,
      annee,
      niveau: eleve.niveau,
      classeId: eleve.classeId,
      classeNom: classeActuelle?.nom ?? eleve.classeId,
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
    diplomes: eleves.filter((e) => e.statut === "diplome").length,
    enPostBac: eleves.filter((e) => e.statut === "universite").length,
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
        if (eleve) recalculerMoyenneEleve(clone, eleve, evaluation.trimestre, evaluation.annee);

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
          if (eleve) recalculerMoyenneEleve(clone, eleve, evaluation.trimestre, evaluation.annee);
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

      lancerConcours: (nom, domaine, niveaux, niveauLibelle, prestige) => {
        const { session } = get();
        if (!session) return;
        const clone: Session = JSON.parse(JSON.stringify(session));

        // Le Concours X / Polytechnique est réservé aux séries scientifiques
        // (prépa MPSI, jamais série A) — imposé ici quel que soit le filtre
        // de niveau choisi dans l'interface, pour ne jamais laisser un profil
        // littéraire y concourir ou le remporter.
        const niveauxEffectifs = prestige ? ["PrepaScientifique"] : niveaux;

        const eligibles = Object.values(clone.eleves).filter((e) => {
          if (e.statut !== "actif" && e.statut !== "redoublant" && e.statut !== "universite") return false;
          if (niveauxEffectifs && !niveauxEffectifs.includes(e.niveau)) return false;
          return true;
        });

        const classement = eligibles
          .map((e) => ({
            matricule: e.matricule,
            nom: e.nom,
            prenom: e.prenom,
            score:
              domaine === "generale"
                ? e.moyennes[e.moyennes.length - 1]?.moyenneGenerale ?? 0
                : scoreDuDomaine(e, domaine),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((e, i) => ({ ...e, rang: i + 1 }));

        if (!clone.concours) clone.concours = [];
        clone.concours.unshift({
          id: uuid(),
          nom,
          domaine,
          niveauLibelle,
          annee: clone.anneeCourante.libelle,
          podium: classement,
        });

        classement.forEach((p) => {
          const montant = MONTANTS_CONCOURS[p.rang - 1];
          if (montant) {
            const eleve = clone.eleves[p.matricule];
            if (eleve) crediterEleve(eleve, montant, `${nom} — ${p.rang}${p.rang === 1 ? "er" : "e"} place`, clone.anneeCourante.libelle);
          }
        });

        // Le lauréat d'un concours prestigieux (Concours X / Polytechnique)
        // obtient en plus le statut d'admission d'excellence et une bourse
        // spéciale, comme une admission directe en école d'ingénieurs.
        if (prestige && classement[0]) {
          const laureat = clone.eleves[classement[0].matricule];
          if (laureat) {
            laureat.admissiblePolytechnique = true;
            crediterEleve(
              laureat,
              MONTANT_ADMISSION_EXCELLENCE,
              `${nom} — Lauréat`,
              clone.anneeCourante.libelle
            );
          }
        }

        set({ session: clone });
      },

      genererNotesPourNiveau: (groupeCle: string) => {
        const { session } = get();
        if (!session) return 0;
        const clone: Session = JSON.parse(JSON.stringify(session));
        const matieresGenerees = genererNotesPourNiveau(clone, groupeCle);
        set({ session: clone });
        return matieresGenerees;
      },
    }),
    {
      name: "academie-session-storage",
    }
  )
);
