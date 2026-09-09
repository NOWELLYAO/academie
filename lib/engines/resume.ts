import { Session } from "../models/types";
import { NOM_NIVEAU } from "../data/subjects";

const NIVEAUX_POST_BAC = ["PrepaScientifique", "PrepaLitteraire", "DUT", "Universite", "EcoleIngenieurs"];

/** Construit un message décrivant ce qui vient de se passer lors du dernier
 * clic sur la timeline, en comparant l'état de la session avant et après
 * l'étape. Pensé pour que le joueur sache toujours "où il en est" et ce que
 * son clic a concrètement changé, plutôt que d'avancer à l'aveugle. */
export function construireResumeEtape(
  etapeAvant: string,
  annee: string,
  avant: Session,
  apres: Session
): string {
  switch (etapeAvant) {
    case "T1":
    case "T2":
    case "T3": {
      const n = etapeAvant.slice(1);
      const actifs = Object.values(apres.eleves).filter(
        (e) => e.statut === "actif" || e.statut === "redoublant" || e.statut === "universite"
      ).length;
      return (
        `Trimestre ${n} simulé pour ${actifs} élèves — du collège au cycle supérieur (post-bac inclus). ` +
        `Seules les classes sans notes pour ce trimestre ont été complétées automatiquement ; ` +
        `si vous avez déjà géré une classe manuellement, elle n'a pas été modifiée.`
      );
    }

    case "examen": {
      const enVie = (e: (typeof avant.eleves)[string]) =>
        e.statut === "actif" || e.statut === "redoublant" || e.statut === "universite";
      const n3e = Object.values(avant.eleves).filter((e) => e.niveau === "3e" && enVie(e)).length;
      const nTerm = Object.values(avant.eleves).filter(
        (e) => (e.niveau === "TermA" || e.niveau === "TermC" || e.niveau === "TermD") && enVie(e)
      ).length;
      const autres = Object.values(avant.eleves).filter(
        (e) => enVie(e) && e.niveau !== "3e" && !["TermA", "TermC", "TermD"].includes(e.niveau)
      ).length;
      return (
        `Épreuves de fin d'année : BEPC pour ${n3e} élèves de 3e, Baccalauréat pour ${nTerm} ` +
        `élèves de Terminale. Les ${autres} autres élèves (Seconde, Première, et tout le cycle ` +
        `post-bac) n'ont pas d'examen national — leur résultat est la moyenne annuelle de contrôle continu.`
      );
    }

    case "orientation": {
      let passages = 0;
      let redoublements = 0;
      let recales = 0;
      const versPostBac: Record<string, number> = {};

      Object.values(apres.eleves).forEach((e) => {
        const avantE = avant.eleves[e.matricule];
        if (!avantE) return;
        if (avantE.statut !== "recale" && e.statut === "recale") {
          recales++;
        } else if (avantE.statut !== "redoublant" && e.statut === "redoublant") {
          redoublements++;
        } else if (
          (avantE.statut === "actif" || avantE.statut === "redoublant") &&
          avantE.niveau !== e.niveau
        ) {
          passages++;
          if (NIVEAUX_POST_BAC.includes(e.niveau)) {
            versPostBac[e.niveau] = (versPostBac[e.niveau] ?? 0) + 1;
          }
        }
      });

      let message = `Orientation ${annee} appliquée : ${passages} passages, ${redoublements} redoublements, ${recales} recalés.`;

      const totalPostBac = Object.values(versPostBac).reduce((a, b) => a + b, 0);
      if (totalPostBac > 0) {
        const detail = Object.entries(versPostBac)
          .map(([niveau, n]) => `${n} en ${NOM_NIVEAU[niveau as keyof typeof NOM_NIVEAU]}`)
          .join(", ");
        message += ` ${totalPostBac} bachelier(s) orienté(s) après le Bac : ${detail}.`;
      }
      return message;
    }

    case "annee_suivante":
      return `Nouvelle année scolaire lancée : ${apres.anneeCourante.libelle}. Les classes ont été recomposées par mérite.`;

    default:
      return "";
  }
}
