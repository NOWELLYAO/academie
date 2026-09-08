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
  estNiveauExamen,
  niveauSuivant,
  orienterApresSecondeC,
  orienterFinDe3e,
  orienterPostBac,
} from "./orientation";
import { NOM_NIVEAU } from "../data/subjects";
import { calculerMention, LIBELLE_MENTION } from "./mentions";
import {
  crediterEleve,
  MONTANTS_MENTION,
  MONTANT_ADMISSION_EXCELLENCE,
  MONTANT_BOURSE_MERITE,
  SEUIL_BOURSE_MERITE,
} from "./finances";

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

    // Récompense de mérite liée à la mention du trimestre
    const mention = calculerMention(moyenneGenerale);
    if (mention) {
      crediterEleve(
        eleve,
        MONTANTS_MENTION[mention],
        `Mention "${LIBELLE_MENTION[mention]}" — T${trimestre}`,
        session.anneeCourante.libelle,
        trimestre
      );
    }
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

/** Moyenne annuelle = moyenne simple des moyennes des 3 trimestres de
 * l'année en cours (et non la seule moyenne du 3e trimestre). */
function moyenneAnnuelleTrimestres(eleve: Eleve, annee: string): number {
  const trimestres = eleve.moyennes.filter((m) => m.annee === annee);
  if (trimestres.length === 0) return 0;
  const total = trimestres.reduce((acc, m) => acc + m.moyenneGenerale, 0);
  return Math.round((total / trimestres.length) * 100) / 100;
}

/** Organise la fin d'année : seules la 3e et la Terminale (A/C/D) sont des
 * classes d'examen (BEPC / Baccalauréat), combinant la moyenne annuelle de
 * contrôle continu et une épreuve finale. Les autres niveaux (Seconde,
 * Première) ne passent aucun examen national : leur résultat de fin
 * d'année est simplement la moyenne annuelle des 3 trimestres. */
export function simulerExamen(session: Session): void {
  const rng = rngDeSession(session, `EXAMEN-${session.anneeCourante.libelle}`);

  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;

    const moyenneAnnuelle = moyenneAnnuelleTrimestres(eleve, session.anneeCourante.libelle);
    let moyenneFinale = moyenneAnnuelle;

    if (estNiveauExamen(eleve.niveau)) {
      // Note d'examen influencée par la compétence moyenne + un facteur de stress aléatoire
      const matieres = matieresDuNiveau(eleve.niveau);
      const moyennesMatieres = matieres.map((m) => eleve.competences[m.key] ?? 10);
      const moyenneCompetences = moyennesMatieres.reduce((a, b) => a + b, 0) / moyennesMatieres.length;
      const stress = (rng() - 0.5) * 2 * (1 - eleve.potentiel.resilience) * 2;
      const noteExamen = Math.max(0, Math.min(20, moyenneCompetences + stress));

      // Pondération classique : 60% contrôle continu annuel, 40% épreuve finale
      moyenneFinale = Math.round((moyenneAnnuelle * 0.6 + noteExamen * 0.4) * 100) / 100;
    }

    eleve.competences.progression = calculerIndicateurProgression(eleve);
    const derniere = eleve.moyennes[eleve.moyennes.length - 1];
    if (derniere) derniere.moyenneGenerale = moyenneFinale;
  });

  session.anneeCourante.etapeCourante = "orientation";
}

/** Applique l'orientation automatique de fin d'année (passage / redoublement / recalage / filière). */
export function simulerOrientation(session: Session): void {
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "actif" && eleve.statut !== "redoublant") return;

    // Bourse au mérite : versée chaque année où la moyenne annuelle atteint
    // le seuil, quel que soit le niveau. Le statut "boursier" est acquis
    // définitivement dès la première fois.
    const moyenneAnnee = eleve.moyennes[eleve.moyennes.length - 1]?.moyenneGenerale ?? 0;
    if (moyenneAnnee >= SEUIL_BOURSE_MERITE) {
      eleve.boursier = true;
      crediterEleve(
        eleve,
        MONTANT_BOURSE_MERITE,
        `Bourse au mérite — ${session.anneeCourante.libelle}`,
        session.anneeCourante.libelle
      );
    }

    let decision = decisionProgression(eleve, session.anneeCourante.libelle);

    // Un seul redoublement autorisé sur tout le parcours scolaire : au-delà,
    // c'est un recalage (règle simple et prévisible plutôt qu'un cycle
    // indéfini de redoublements qui serait illisible).
    if (decision === "redoublement" && eleve.redoublements >= 1) {
      decision = "recale";
    }

    if (decision === "recale") {
      eleve.statut = "recale";
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: eleve.niveau,
        niveauDestination: "recale",
        motif:
          eleve.redoublements >= 1
            ? "Nouvel échec après un redoublement — un seul redoublement est autorisé dans le parcours."
            : "Résultats très insuffisants sur l'année.",
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
        motif: `Redoublement de ${NOM_NIVEAU[eleve.niveau]} — résultats insuffisants pour passer (1 seul redoublement autorisé au total).`,
        scoreDetail: {},
      });
      return;
    }

    if (decision === "avertissement") {
      // Passage accepté mais fragile — on le trace pour rester transparent
      // sans pour autant bloquer la progression.
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine: eleve.niveau,
        niveauDestination: eleve.niveau,
        motif: "Passage accordé avec avertissement — résultats fragiles à surveiller.",
        scoreDetail: {},
      });
    }

    // passage (ou avertissement) -> orientation vers le niveau suivant
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
      // Fin de Terminale -> orientation post-bac (prépa, DUT, université, école d'ingénieurs)
      const niveauOrigine = eleve.niveau;
      const { niveau: destination, motif, excellence } = orienterPostBac(eleve);
      eleve.admissiblePolytechnique = excellence;
      eleve.statut = "universite";
      eleve.niveau = destination;
      eleve.historiqueOrientation.push({
        annee: session.anneeCourante.libelle,
        niveauOrigine,
        niveauDestination: destination,
        motif,
        scoreDetail: {},
      });
      if (excellence) {
        crediterEleve(
          eleve,
          MONTANT_ADMISSION_EXCELLENCE,
          "Bourse d'excellence — admission post-bac",
          session.anneeCourante.libelle
        );
      }
      eleve.anneePostBac = 1;
    }
  });

  avancerPostBac(session);
  recomposerClasses(session);
  capturerSnapshotAnnee(session);
  session.anneeCourante.etapeCourante = "annee_suivante";
}

/** Durée (en années) de chaque cursus post-bac. Une classe préparatoire
 * débouche ensuite sur une école d'ingénieurs (3 années) ou l'université —
 * ce qui porte bien le cursus scientifique complet à 5 ans, comme dans le
 * système réel. Chaque parcours se termine par un diplôme (statut
 * "diplome"), jamais par un blocage silencieux. */
const DUREE_POST_BAC: Partial<Record<Niveau, number>> = {
  PrepaScientifique: 2,
  PrepaLitteraire: 2,
  DUT: 2,
  Universite: 3,
  EcoleIngenieurs: 3, // 3 années après une prépa, 5 en admission directe (voir logique ci-dessous)
};

/** Fait avancer d'une année tous les élèves déjà engagés dans un cursus
 * post-bac (statut "universite") : passage à l'année suivante, transition
 * prépa -> école/université, ou obtention du diplôme final. C'est cette
 * fonction qui manquait et qui faisait que le parcours semblait "s'arrêter"
 * après le Bac. */
function avancerPostBac(session: Session): void {
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut !== "universite") return;

    eleve.anneePostBac = (eleve.anneePostBac ?? 0) + 1;
    const annee = session.anneeCourante.libelle;

    // Admission directe en école d'ingénieurs (excellence au Bac) : cursus
    // complet de 5 ans dès le départ. Admission via prépa : 3 années
    // restantes (2 déjà accomplies en classe préparatoire).
    const duree =
      eleve.niveau === "EcoleIngenieurs"
        ? eleve.admissiblePolytechnique
          ? 5
          : 3
        : DUREE_POST_BAC[eleve.niveau] ?? 3;

    if (eleve.anneePostBac < duree) {
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: eleve.niveau,
        niveauDestination: eleve.niveau,
        motif: `Passage en ${eleve.anneePostBac + 1}e année de ${NOM_NIVEAU[eleve.niveau]}.`,
        scoreDetail: {},
      });
      return;
    }

    // Fin du cycle en cours
    if (eleve.niveau === "PrepaScientifique") {
      eleve.niveau = "EcoleIngenieurs";
      eleve.anneePostBac = 0;
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: "PrepaScientifique",
        niveauDestination: "EcoleIngenieurs",
        motif: "Admission à l'école d'ingénieurs à l'issue de la classe préparatoire (3 années restantes).",
        scoreDetail: {},
      });
      return;
    }

    if (eleve.niveau === "PrepaLitteraire") {
      eleve.niveau = "Universite";
      eleve.anneePostBac = 0;
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: "PrepaLitteraire",
        niveauDestination: "Universite",
        motif: "Poursuite à l'université à l'issue de la classe préparatoire littéraire.",
        scoreDetail: {},
      });
      return;
    }

    // DUT, Université ou École d'ingénieurs achevés -> diplôme, fin de parcours
    eleve.statut = "diplome";
    eleve.historiqueOrientation.push({
      annee,
      niveauOrigine: eleve.niveau,
      niveauDestination: eleve.niveau,
      motif: `Diplômé — ${NOM_NIVEAU[eleve.niveau]} (cursus de ${duree} an${duree > 1 ? "s" : ""}).`,
      scoreDetail: {},
    });
  });
}

/** Enregistre une photographie de la génération à la fin de l'année qui
 * vient de s'achever (répartition par niveau, moyenne, taux de réussite,
 * destinations post-bac) pour permettre de tracer son évolution dans le
 * temps sur plusieurs années. */
function capturerSnapshotAnnee(session: Session): void {
  const eleves = Object.values(session.eleves);
  const actifs = eleves.filter((e) => e.statut === "actif" || e.statut === "redoublant");

  const repartitionNiveaux: Partial<Record<Niveau, number>> = {};
  eleves.forEach((e) => {
    // On ne compte que les élèves encore "vivants" dans le parcours
    // (actifs, redoublants, ou déjà en post-bac) — pas les recalés.
    if (e.statut === "recale") return;
    repartitionNiveaux[e.niveau] = (repartitionNiveaux[e.niveau] ?? 0) + 1;
  });

  const moyennes = actifs
    .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
    .filter((m): m is number => m !== undefined);
  const moyenneGenerale = moyennes.length
    ? Math.round((moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 100) / 100
    : 0;
  const tauxReussite = moyennes.length
    ? Math.round((moyennes.filter((m) => m >= 10).length / moyennes.length) * 100)
    : 0;

  session.historiqueBilans.push({
    annee: session.anneeCourante.libelle,
    repartitionNiveaux,
    moyenneGenerale,
    tauxReussite,
    passages: eleves.filter((e) => e.statut === "actif").length,
    redoublements: eleves.filter((e) => e.statut === "redoublant").length,
    recales: eleves.filter((e) => e.statut === "recale").length,
    prepaScientifique: eleves.filter((e) => e.niveau === "PrepaScientifique").length,
    prepaLitteraire: eleves.filter((e) => e.niveau === "PrepaLitteraire").length,
    dut: eleves.filter((e) => e.niveau === "DUT").length,
    universitaires: eleves.filter((e) => e.niveau === "Universite").length,
    ecolesIngenieurs: eleves.filter((e) => e.niveau === "EcoleIngenieurs").length,
    admissionExcellence: eleves.filter((e) => e.admissiblePolytechnique).length,
  });
}

/** Recompose les classes après un changement de niveau (ex: 3e A -> Seconde C1).
 * Les élèves sont triés par mérite (moyenne générale la plus récente) avant
 * répartition : le groupe 1 rassemble toujours les meilleurs éléments de la
 * série, le groupe 2 le niveau suivant, etc. (ex: 1ère C1 plus fort que 1ère C2). */
function recomposerClasses(session: Session): void {
  const niveaux = new Set(
    Object.values(session.eleves)
      .filter((e) => e.statut === "actif" || e.statut === "redoublant")
      .map((e) => e.niveau)
  );

  const nouvellesClasses: Classe[] = [];

  niveaux.forEach((niveau) => {
    const elevesDuNiveau = Object.values(session.eleves)
      .filter((e) => e.niveau === niveau && (e.statut === "actif" || e.statut === "redoublant"))
      .sort((a, b) => {
        const moyA = a.moyennes[a.moyennes.length - 1]?.moyenneGenerale ?? 0;
        const moyB = b.moyennes[b.moyennes.length - 1]?.moyenneGenerale ?? 0;
        return moyB - moyA;
      });

    const taillesClasse = 45;
    const nbClasses = Math.max(1, Math.ceil(elevesDuNiveau.length / taillesClasse));

    for (let i = 0; i < nbClasses; i++) {
      const id = `${niveau}-${i + 1}`;
      const membres = elevesDuNiveau.slice(i * taillesClasse, (i + 1) * taillesClasse);
      membres.forEach((e) => (e.classeId = id));
      nouvellesClasses.push({
        id,
        // Le numéro de groupe est accolé directement à la série, sans espace
        // (ex: "Seconde A1", "1ère C2") pour bien le distinguer de la lettre
        // de série elle-même. Le groupe 1 contient les meilleurs éléments.
        nom: nbClasses > 1 ? `${NOM_NIVEAU[niveau]}${i + 1}` : NOM_NIVEAU[niveau],
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
