import { Classe, Eleve, MoyenneTrimestre, Niveau, Session } from "../models/types";
import { matieresDuNiveau } from "../data/subjects";
import { mulberry32, RNG } from "../utils/random";
import {
  calculerMoyenneTrimestre,
  creerEvaluation,
  genererNotesAutomatiques,
} from "./grading";
import { tirerEvenement } from "./events";
import { calculerIndicateurProgression } from "./progression";
import { classerClasse, classerGeneration } from "./ranking";
import {
  decisionProgression,
  niveauSuivant,
  orienterApresSecondeC,
  orienterFinDe3e,
  recommanderFiliereUniversitaire,
} from "./orientation";
import { NOM_NIVEAU } from "../data/subjects";

function rngDeSession(session: Session, sel: string): RNG {
  // Dérive une seed déterministe mais différente à chaque étape à partir
  // de la seed de session, pour rester reproductible.
  let hash = session.seed;
  for (let i = 0; i < sel.length; i++) hash = (hash * 31 + sel.charCodeAt(i)) | 0;
  return mulberry32(hash);
}

/** Génère automatiquement un jeu d'évaluations réalistes pour un trimestre. */
export function simulerTrimestre(session: Session, trimestre: 1 | 2 | 3): void {
  const rng = rngDeSession(session, `T${trimestre}-${session.anneeCourante.libelle}`);

  session.classes.forEach((classe) => {
    const eleveRef = session.eleves[classe.matricules[0]];
    if (!eleveRef) return;
    const matieres = matieresDuNiveau(classe.niveau);

    matieres.forEach((matiere) => {
      // 2 à 4 évaluations par matière et par trimestre
      const nbEvals = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < nbEvals; i++) {
        const type = i === nbEvals - 1 ? "controle" : "devoir";
        const evaluation = creerEvaluation(
          classe.id,
          matiere.key,
          type,
          20,
          1,
          trimestre,
          session.anneeCourante.libelle
        );
        genererNotesAutomatiques(rng, session, evaluation, classe);
        session.evaluations.push(evaluation);
      }
    });
  });

  // Calcul des moyennes trimestrielles pour chaque élève
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;
    const { parMatiere, moyenneGenerale } = calculerMoyenneTrimestre(
      eleve,
      trimestre,
      session.anneeCourante.libelle
    );
    const moyenne: MoyenneTrimestre = {
      trimestre,
      annee: session.anneeCourante.libelle,
      niveau: eleve.niveau,
      parMatiere,
      moyenneGenerale,
      rangClasse: 0,
      rangEtablissement: 0,
      rangGeneration: 0,
    };
    eleve.moyennes.push(moyenne);
    calculerIndicateurProgression(eleve);
  });

  // Classements
  session.classes.forEach((classe) => {
    const classement = classerClasse(session, classe.id);
    classement.forEach((entree) => {
      const eleve = session.eleves[entree.matricule];
      const derniere = eleve.moyennes[eleve.moyennes.length - 1];
      if (derniere) derniere.rangClasse = entree.rang;
    });
  });

  const classementGeneration = classerGeneration(session);
  classementGeneration.forEach((entree) => {
    const eleve = session.eleves[entree.matricule];
    const derniere = eleve.moyennes[eleve.moyennes.length - 1];
    if (derniere) {
      derniere.rangGeneration = entree.rang;
      derniere.rangEtablissement = entree.rang;
    }
  });

  // Événements scolaires
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;
    const evenement = tirerEvenement(rng, eleve, trimestre, session.anneeCourante.libelle);
    if (evenement) eleve.evenements.push(evenement);
  });

  session.anneeCourante.trimestreCourant = trimestre;
  session.anneeCourante.etapeCourante = trimestre === 3 ? "examen" : trimestre === 2 ? "T3" : "T2";
}

/** Organise l'examen de fin d'année (moyenne annuelle + épreuve finale). */
export function simulerExamen(session: Session): void {
  const rng = rngDeSession(session, `EXAMEN-${session.anneeCourante.libelle}`);

  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;
    // Note d'examen influencée par la compétence moyenne + un facteur de stress aléatoire
    const matieres = matieresDuNiveau(eleve.niveau);
    const moyennesMatieres = matieres.map((m) => eleve.competences[m.key] ?? 10);
    const moyenne = moyennesMatieres.reduce((a, b) => a + b, 0) / moyennesMatieres.length;
    const stress = (rng() - 0.5) * 2 * (1 - eleve.potentiel.resilience) * 2;
    const noteExamen = Math.max(0, Math.min(20, moyenne + stress));

    eleve.competences.progression = calculerIndicateurProgression(eleve);
    // On stocke le résultat d'examen comme dernière moyenne "consolidée"
    const derniere = eleve.moyennes[eleve.moyennes.length - 1];
    if (derniere) {
      derniere.moyenneGenerale = Math.round(((derniere.moyenneGenerale * 3 + noteExamen) / 4) * 100) / 100;
    }
  });

  session.anneeCourante.etapeCourante = "orientation";
}

/** Applique l'orientation automatique de fin d'année (passage / redoublement / recalage / filière). */
export function simulerOrientation(session: Session): void {
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;

    const decision = decisionProgression(eleve, session.anneeCourante.libelle);

    if (decision === "recale") {
      eleve.statut = "recale";
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: eleve.niveau,
        niveauDestination: "recale",
        motif: "Résultats très insuffisants sur l'année.",
        scoreDetail: {},
      });
      return;
    }

    if (decision === "redoublement") {
      eleve.statut = "redoublant";
      eleve.redoublements += 1;
      eleve.anneesRedoublees.push(session.anneeCourante.libelle);
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: eleve.niveau,
        niveauDestination: "redoublement",
        motif: "Résultats insuffisants pour passer dans le niveau supérieur.",
        scoreDetail: {},
      });
      return;
    }

    // passage ou avertissement -> orientation vers le niveau suivant
    if (eleve.niveau === "3e") {
      const entree = orienterFinDe3e(eleve, session.anneeCourante.libelle);
      eleve.niveau = entree.niveauDestination as Niveau;
      eleve.historiqueOrientation.push(entree);
      eleve.statut = "actif";
      return;
    }

    if (eleve.niveau === "2ndeC") {
      const entree = orienterApresSecondeC(eleve, session.anneeCourante.libelle);
      eleve.niveau = entree.niveauDestination as Niveau;
      eleve.historiqueOrientation.push(entree);
      eleve.statut = "actif";
      return;
    }

    const suivant = niveauSuivant(eleve.niveau);
    if (suivant) {
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: eleve.niveau,
        niveauDestination: suivant,
        motif: "Passage en classe supérieure.",
        scoreDetail: {},
      });
      eleve.niveau = suivant;
      eleve.statut = "actif";
    } else {
      // Fin de Terminale -> orientation universitaire
      const { admissiblePolytechnique } = recommanderFiliereUniversitaire(eleve);
      eleve.admissiblePolytechnique = admissiblePolytechnique;
      eleve.statut = "universite";
      eleve.niveau = admissiblePolytechnique ? "EcoleIngenieurs" : "Universite";
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: "TermC",
        niveauDestination: eleve.niveau,
        motif: admissiblePolytechnique
          ? "Profil scientifique exceptionnel — admissible Polytechnique."
          : "Orientation universitaire selon compétences dominantes.",
        scoreDetail: {},
      });
    }
  });

  recomposerClasses(session);
  session.anneeCourante.etapeCourante = "annee_suivante";
}

/** Recompose les classes après un changement de niveau (ex: 3e A -> Seconde C1). */
function recomposerClasses(session: Session): void {
  const niveaux = new Set(
    Object.values(session.eleves)
      .filter((e) => e.statut === "actif" || e.statut === "redoublant")
      .map((e) => e.niveau)
  );

  const nouvellesClasses: Classe[] = [];

  niveaux.forEach((niveau) => {
    const elevesDuNiveau = Object.values(session.eleves).filter(
      (e) => e.niveau === niveau && (e.statut === "actif" || e.statut === "redoublant")
    );
    const taillesClasse = 45;
    const nbClasses = Math.max(1, Math.ceil(elevesDuNiveau.length / taillesClasse));

    for (let i = 0; i < nbClasses; i++) {
      const suffixe = String.fromCharCode(65 + i); // A, B, C...
      const id = `${niveau}-${suffixe}`;
      const membres = elevesDuNiveau.slice(i * taillesClasse, (i + 1) * taillesClasse);
      membres.forEach((e) => (e.classeId = id));
      nouvellesClasses.push({
        id,
        nom: `${NOM_NIVEAU[niveau]} ${suffixe}`,
        niveau,
        matricules: membres.map((e) => e.matricule),
        annee: session.anneeCourante.libelle,
      });
    }
  });

  session.classes = nouvellesClasses;
}

/** Passe à l'année scolaire suivante et réinitialise la timeline. */
export function passerAnneeSuivante(session: Session): void {
  session.historiqueAnnees.push(session.anneeCourante.libelle);
  const [debut] = session.anneeCourante.libelle.split("-").map(Number);
  const nouvelleAnnee = `${debut + 1}-${debut + 2}`;
  session.anneeCourante = { libelle: nouvelleAnnee, trimestreCourant: 1, etapeCourante: "T1" };
}

export function etapeSuivante(session: Session): void {
  switch (session.anneeCourante.etapeCourante) {
    case "T1":
      simulerTrimestre(session, 1);
      break;
    case "T2":
      simulerTrimestre(session, 2);
      break;
    case "T3":
      simulerTrimestre(session, 3);
      break;
    case "examen":
      simulerExamen(session);
      break;
    case "orientation":
      simulerOrientation(session);
      break;
    case "annee_suivante":
      passerAnneeSuivante(session);
      break;
  }
}
