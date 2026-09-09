import { Classe, Eleve, Niveau, Session } from "../models/types";
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
import { NOM_NIVEAU, estPostBac } from "../data/subjects";
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

/** Un élève "scolarisé" cette année reçoit des notes et progresse — cela
 * inclut désormais le post-bac (statut "universite"), qui suit exactement
 * le même moteur de notes que le secondaire. */
function estScolarise(statut: Eleve["statut"]): boolean {
  return statut === "actif" || statut === "redoublant" || statut === "universite";
}

/** Génère les évaluations d'une classe pour un trimestre donné, matière par
 * matière. N'écrase jamais un travail déjà fait : si une matière a déjà des
 * évaluations pour ce trimestre (saisie manuelle ou génération précédente),
 * elle est ignorée. Utilisable pour UNE classe isolée (bouton par niveau)
 * ou en boucle pour tout l'établissement (bouton global). */
export function genererEvaluationsClasseTrimestre(
  session: Session,
  classe: Classe,
  trimestre: 1 | 2 | 3,
  rng: RNG
): number {
  const matieres = matieresDuNiveau(classe.niveau);
  let matieresGenerees = 0;

  matieres.forEach((matiere) => {
    const dejaTraitee = session.evaluations.some(
      (ev) =>
        ev.classeId === classe.id &&
        ev.matiere === matiere.key &&
        ev.trimestre === trimestre &&
        ev.annee === session.anneeCourante.libelle
    );
    if (dejaTraitee) return; // on ne reprend pas un travail déjà fait pour cette classe

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
    matieresGenerees++;
  });

  return matieresGenerees;
}

/** Recalcule la moyenne trimestrielle d'un élève à partir de ses notes
 * actuelles pour ce trimestre (sans changer son niveau ni son statut). */
function recalculerMoyenneTrimestreEleve(
  session: Session,
  eleve: Eleve,
  trimestre: 1 | 2 | 3
): void {
  const { parMatiere, moyenneGenerale } = calculerMoyenneTrimestre(
    eleve,
    trimestre,
    session.anneeCourante.libelle
  );
  let entree = eleve.moyennes.find(
    (m) => m.trimestre === trimestre && m.annee === session.anneeCourante.libelle
  );
  if (!entree) {
    const classeActuelle = session.classes.find((c) => c.id === eleve.classeId);
    entree = {
      trimestre,
      annee: session.anneeCourante.libelle,
      niveau: eleve.niveau,
      classeId: eleve.classeId,
      classeNom: classeActuelle?.nom ?? NOM_NIVEAU[eleve.niveau],
      parMatiere: [],
      moyenneGenerale: 0,
      rangClasse: 0,
      rangEtablissement: 0,
      rangGeneration: 0,
    };
    eleve.moyennes.push(entree);
    calculerIndicateurProgression(eleve);
  }
  entree.parMatiere = parMatiere;
  entree.moyenneGenerale = moyenneGenerale;

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
}

/** Génère les notes du trimestre en cours pour UNE SEULE classe (bouton
 * dédié par niveau/classe, y compris post-bac) et recalcule les moyennes
 * des élèves concernés. Ne touche à aucune autre classe. */
/** Clé de regroupement par "niveau" au sens où l'utilisateur l'entend : un
 * niveau du secondaire (ex: "Seconde C", qui peut compter plusieurs
 * classes C1, C2...) ou une promotion post-bac précise (ex: "École
 * d'ingénieurs — 1ère année", jamais mélangée avec la 3e année). */
export function cleNiveauEleve(eleve: Eleve): string {
  return estPostBac(eleve.niveau) ? `${eleve.niveau}::${eleve.anneePostBac ?? 1}` : eleve.niveau;
}

export interface GroupeNiveau {
  cle: string;
  niveau: Niveau;
  anneePostBac?: number;
  libelle: string;
  classes: Classe[];
  nbEleves: number;
}

/** Liste tous les groupes de niveau actuellement scolarisés, chacun avec
 * ses classes rattachées — c'est cette liste qui alimente les boutons "par
 * niveau" (et non par classe) de la page Notes par niveau. */
export function listerGroupesNiveau(session: Session): GroupeNiveau[] {
  const groupes = new Map<string, GroupeNiveau>();

  session.classes.forEach((classe) => {
    const eleveRef = session.eleves[classe.matricules[0]];
    if (!eleveRef) return;
    const cle = cleNiveauEleve(eleveRef);

    if (!groupes.has(cle)) {
      const anneePostBac = estPostBac(eleveRef.niveau) ? eleveRef.anneePostBac ?? 1 : undefined;
      const libelle = anneePostBac
        ? `${NOM_NIVEAU[eleveRef.niveau]} — ${anneePostBac === 1 ? "1ère" : `${anneePostBac}e`} année`
        : NOM_NIVEAU[eleveRef.niveau];
      groupes.set(cle, {
        cle,
        niveau: eleveRef.niveau,
        anneePostBac,
        libelle,
        classes: [],
        nbEleves: 0,
      });
    }
    const groupe = groupes.get(cle)!;
    groupe.classes.push(classe);
    groupe.nbEleves += classe.matricules.length;
  });

  return Array.from(groupes.values()).sort((a, b) => a.libelle.localeCompare(b.libelle));
}

/** Génère les notes du trimestre en cours pour TOUTES les classes d'un même
 * niveau en un seul clic (ex: les 6 classes de Seconde C d'un coup) — et
 * pour rien d'autre. Idempotent : ne duplique jamais un travail déjà fait. */
export function genererNotesPourNiveau(session: Session, groupeCle: string): number {
  const groupe = listerGroupesNiveau(session).find((g) => g.cle === groupeCle);
  if (!groupe) return 0;

  const trimestre = session.anneeCourante.trimestreCourant;
  const rng = rngDeSession(
    session,
    `NIVEAU-${groupeCle}-T${trimestre}-${session.anneeCourante.libelle}`
  );

  let matieresGenerees = 0;
  groupe.classes.forEach((classe) => {
    matieresGenerees += genererEvaluationsClasseTrimestre(session, classe, trimestre, rng);
    classe.matricules.forEach((matricule) => {
      const eleve = session.eleves[matricule];
      if (eleve) recalculerMoyenneTrimestreEleve(session, eleve, trimestre);
    });
  });

  // Reclassement (au sein de chaque classe et de la génération) pour rester cohérent
  groupe.classes.forEach((classe) => {
    const classementClasse = classerClasse(session, classe.id);
    classementClasse.forEach((entree) => {
      const eleve = session.eleves[entree.matricule];
      const derniere = eleve?.moyennes[eleve.moyennes.length - 1];
      if (derniere && derniere.trimestre === trimestre) derniere.rangClasse = entree.rang;
    });
  });

  const classementGeneration = classerGeneration(session);
  classementGeneration.forEach((entree) => {
    const eleve = session.eleves[entree.matricule];
    const derniere = eleve?.moyennes[eleve.moyennes.length - 1];
    if (derniere && derniere.trimestre === trimestre) {
      derniere.rangGeneration = entree.rang;
      derniere.rangEtablissement = entree.rang;
    }
  });

  return matieresGenerees;
}

/** Génère automatiquement un jeu d'évaluations réalistes pour un trimestre,
 * pour toutes les classes de l'établissement (bouton global du tableau de
 * bord). N'écrase jamais un travail déjà fait classe par classe. */
export function simulerTrimestre(session: Session, trimestre: 1 | 2 | 3): void {
  const rng = rngDeSession(session, `T${trimestre}-${session.anneeCourante.libelle}`);

  session.classes.forEach((classe) => {
    const eleveRef = session.eleves[classe.matricules[0]];
    if (!eleveRef) return;
    genererEvaluationsClasseTrimestre(session, classe, trimestre, rng);
  });

  // Calcul des moyennes trimestrielles pour chaque élève
  Object.values(session.eleves).forEach((eleve) => {
    if (!estScolarise(eleve.statut)) return;
    recalculerMoyenneTrimestreEleve(session, eleve, trimestre);
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
    if (!estScolarise(eleve.statut)) return;
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
    if (!estScolarise(eleve.statut)) return;

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

/** Applique l'orientation automatique de fin d'année (passage / redoublement / recalage / filière),
 * y compris pour les élèves déjà en post-bac : chaque cursus post-bac suit
 * désormais exactement le même moteur (notes, mentions, décision de
 * passage) que le secondaire, avec une durée fixe menant à un diplôme. */
export function simulerOrientation(session: Session): void {
  Object.values(session.eleves).forEach((eleve) => {
    if (!estScolarise(eleve.statut)) return;

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
    if (estPostBac(eleve.niveau)) {
      avancerUneAnneePostBac(eleve, session.anneeCourante.libelle);
      return;
    }

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
      // Fin de Terminale -> première entrée dans le post-bac (prépa, DUT, université, école d'ingénieurs)
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

/** Fait avancer d'une année un élève déjà engagé dans un cursus post-bac,
 * une fois sa décision de passage validée pour l'année (mêmes règles de
 * mention/redoublement que le secondaire) : passage à l'année suivante,
 * transition prépa -> école/université, ou obtention du diplôme final. */
function avancerUneAnneePostBac(eleve: Eleve, annee: string): void {
  eleve.anneePostBac = (eleve.anneePostBac ?? 1) + 1;

  // Admission directe en école d'ingénieurs (excellence au Bac) : cursus
  // complet de 5 ans dès le départ. Admission via prépa : 3 années
  // restantes (2 déjà accomplies en classe préparatoire).
  const duree =
    eleve.niveau === "EcoleIngenieurs"
      ? eleve.admissiblePolytechnique
        ? 5
        : 3
      : DUREE_POST_BAC[eleve.niveau] ?? 3;

  if (eleve.anneePostBac <= duree) {
    eleve.historiqueOrientation.push({
      annee,
      niveauOrigine: eleve.niveau,
      niveauDestination: eleve.niveau,
      motif: `Passage en ${eleve.anneePostBac}e année de ${NOM_NIVEAU[eleve.niveau]}.`,
      scoreDetail: {},
    });
    return;
  }

  // Fin du cycle en cours
  if (eleve.niveau === "PrepaScientifique") {
    eleve.niveau = "EcoleIngenieurs";
    eleve.anneePostBac = 1;
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
    eleve.anneePostBac = 1;
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
 * série, le groupe 2 le niveau suivant, etc. (ex: 1ère C1 plus fort que 1ère C2).
 * Le post-bac reçoit exactement le même traitement — avec en plus un
 * regroupement par année de cursus, pour ne jamais mélanger une 1ère année
 * d'école d'ingénieurs avec une 3e année dans la même classe. */
function recomposerClasses(session: Session): void {
  const actifs = Object.values(session.eleves).filter(
    (e) => e.statut === "actif" || e.statut === "redoublant" || e.statut === "universite"
  );

  function cleGroupe(e: Eleve): string {
    return cleNiveauEleve(e);
  }

  const groupes = new Map<string, Eleve[]>();
  actifs.forEach((e) => {
    const cle = cleGroupe(e);
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(e);
  });

  const nouvellesClasses: Classe[] = [];

  groupes.forEach((membresGroupe, cle) => {
    const [niveauStr, anneeStr] = cle.split("::");
    const niveau = niveauStr as Niveau;
    const anneePostBacGroupe = anneeStr ? Number(anneeStr) : undefined;

    const tries = [...membresGroupe].sort((a, b) => {
      const moyA = a.moyennes[a.moyennes.length - 1]?.moyenneGenerale ?? 0;
      const moyB = b.moyennes[b.moyennes.length - 1]?.moyenneGenerale ?? 0;
      return moyB - moyA;
    });

    const taillesClasse = 45;
    const nbClasses = Math.max(1, Math.ceil(tries.length / taillesClasse));

    for (let i = 0; i < nbClasses; i++) {
      const suffixeAnnee = anneePostBacGroupe ? `-an${anneePostBacGroupe}` : "";
      const id = `${niveau}${suffixeAnnee}-${i + 1}`;
      const membres = tries.slice(i * taillesClasse, (i + 1) * taillesClasse);
      membres.forEach((e) => (e.classeId = id));

      const baseNom = anneePostBacGroupe
        ? `${NOM_NIVEAU[niveau]} — ${anneePostBacGroupe === 1 ? "1ère" : `${anneePostBacGroupe}e`} année`
        : NOM_NIVEAU[niveau];

      nouvellesClasses.push({
        id,
        nom: nbClasses > 1 ? `${baseNom} (groupe ${i + 1})` : baseNom,
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
