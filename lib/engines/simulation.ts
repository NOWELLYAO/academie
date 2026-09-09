import { Classe, Eleve, Niveau, Session } from "../models/types";
import { genererNoteBrute } from "./potential";
import { demarrerCarriere, avancerCarriereEleve } from "./carriere";
import { avancerPatrimoineEleve } from "./patrimoine";
import { avancerMariages } from "./mariage";
import { choisirSpecialiteIngenieur } from "../data/specialitesIngenieur";
import { mulberry32, RNG, clamp } from "../utils/random";
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
import { NOM_NIVEAU, estPostBac, matieresDuNiveau, coefficient } from "../data/subjects";
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
/** Regroupement "grade" du secondaire, indépendant de la filière : Seconde
 * A et Seconde C sont un seul et même niveau pour l'utilisateur, même si ce
 * sont deux séries distinctes en interne (classes et matières séparées). */
const GRADE_SECONDAIRE: Partial<Record<Niveau, string>> = {
  "2ndeA": "Seconde",
  "2ndeC": "Seconde",
  "1ereA": "1ère",
  "1ereC": "1ère",
  "1ereD": "1ère",
  TermA: "Terminale",
  TermC: "Terminale",
  TermD: "Terminale",
};

/** Clé de regroupement utilisée pour la COMPOSITION des classes (doit
 * rester filière par filière : on ne mélange jamais 2ndeA et 2ndeC dans une
 * même classe). Pour le post-bac, regroupe par promotion précise. */
export function cleNiveauEleve(eleve: Eleve): string {
  return estPostBac(eleve.niveau) ? `${eleve.niveau}::${eleve.anneePostBac ?? 1}` : eleve.niveau;
}

/** Clé de regroupement utilisée pour les BOUTONS "par niveau" (Notes par
 * niveau, tableau de bord) : ici on regroupe par niveau réel (3e, Seconde,
 * 1ère, Terminale), toutes filières confondues — jamais par filière. Le
 * post-bac reste groupé par promotion précise (programmes différents, pas
 * de filières d'un même niveau à fusionner). */
function cleBoutonNiveau(eleve: Eleve): string {
  if (estPostBac(eleve.niveau)) return `${eleve.niveau}::${eleve.anneePostBac ?? 1}`;
  return GRADE_SECONDAIRE[eleve.niveau] ?? eleve.niveau;
}

export interface GroupeNiveau {
  cle: string;
  libelle: string;
  estPostBac: boolean;
  classes: Classe[];
  nbEleves: number;
}

/** Liste tous les groupes de niveau actuellement scolarisés, chacun avec
 * ses classes rattachées — c'est cette liste qui alimente les boutons "par
 * niveau" (et non par filière, et non par classe) de la page Notes par
 * niveau et du tableau de bord. Un bouton "Seconde" couvre donc à la fois
 * les classes de Seconde A et de Seconde C. */
export function listerGroupesNiveau(session: Session): GroupeNiveau[] {
  const groupes = new Map<string, GroupeNiveau>();

  session.classes.forEach((classe) => {
    const eleveRef = session.eleves[classe.matricules[0]];
    if (!eleveRef) return;
    const cle = cleBoutonNiveau(eleveRef);
    const postBac = estPostBac(eleveRef.niveau);

    if (!groupes.has(cle)) {
      const anneePostBac = postBac ? eleveRef.anneePostBac ?? 1 : undefined;
      const libelle = anneePostBac
        ? `${NOM_NIVEAU[eleveRef.niveau]} — ${anneePostBac === 1 ? "1ère" : `${anneePostBac}e`} année`
        : GRADE_SECONDAIRE[eleveRef.niveau] ?? NOM_NIVEAU[eleveRef.niveau];
      groupes.set(cle, {
        cle,
        libelle,
        estPostBac: postBac,
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

export type StatutNotation = "complet" | "partiel" | "aucun";

/** Indique, AVANT tout clic, si un niveau a déjà toutes ses évaluations du
 * trimestre en cours ("complet"), aucune ("aucun"), ou seulement certaines
 * classes/matières ("partiel") — pour que l'état soit visible sans avoir à
 * cliquer pour le découvrir. */
export function statutNotationNiveau(session: Session, groupe: GroupeNiveau): StatutNotation {
  const trimestre = session.anneeCourante.trimestreCourant;
  const annee = session.anneeCourante.libelle;
  let attendues = 0;
  let presentes = 0;

  groupe.classes.forEach((classe) => {
    const matieres = matieresDuNiveau(classe.niveau);
    matieres.forEach((matiere) => {
      attendues++;
      const existe = session.evaluations.some(
        (ev) =>
          ev.classeId === classe.id &&
          ev.matiere === matiere.key &&
          ev.trimestre === trimestre &&
          ev.annee === annee
      );
      if (existe) presentes++;
    });
  });

  if (presentes === 0) return "aucun";
  if (presentes >= attendues) return "complet";
  return "partiel";
}

/** Même principe que statutNotationNiveau, mais pour l'étape Examen : indique
 * si les élèves d'un niveau ont déjà leur épreuve (BEPC/Bac) ou leur
 * consolidation annuelle traitée. */
export function statutExamenNiveau(session: Session, groupe: GroupeNiveau): StatutNotation {
  let total = 0;
  let traites = 0;

  groupe.classes.forEach((classe) => {
    classe.matricules.forEach((matricule) => {
      const eleve = session.eleves[matricule];
      if (!eleve || !estScolarise(eleve.statut)) return;
      const derniere = eleve.moyennes[eleve.moyennes.length - 1];
      if (!derniere || derniere.annee !== session.anneeCourante.libelle) return;
      total++;
      if (derniere.examenTraite) traites++;
    });
  });

  if (traites === 0) return "aucun";
  if (traites >= total) return "complet";
  return "partiel";
}

/** Même principe pour l'étape Orientation : indique si les élèves d'un
 * niveau ont déjà leur décision de fin d'année (passage, redoublement,
 * progression post-bac...) traitée. */
export function statutOrientationNiveau(session: Session, groupe: GroupeNiveau): StatutNotation {
  let total = 0;
  let traites = 0;

  groupe.classes.forEach((classe) => {
    classe.matricules.forEach((matricule) => {
      const eleve = session.eleves[matricule];
      if (!eleve || !estScolarise(eleve.statut)) return;
      total++;
      if (eleve.orientationAnneeTraitee === session.anneeCourante.libelle) traites++;
    });
  });

  if (traites === 0) return "aucun";
  if (traites >= total) return "complet";
  return "partiel";
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
/** Moyenne annuelle = moyenne pondérée des 3 trimestres, T1 comptant pour
 * 1 et T2/T3 comptant chacun pour 2 (les résultats du 2e et du 3e
 * trimestre pèsent donc davantage que ceux du 1er dans la moyenne
 * générale annuelle). Si un trimestre manque encore, la pondération
 * s'ajuste automatiquement sur les trimestres disponibles. */
const POIDS_TRIMESTRE: Record<number, number> = { 1: 1, 2: 2, 3: 2 };

function moyenneAnnuelleTrimestres(eleve: Eleve, annee: string): number {
  const trimestres = eleve.moyennes.filter((m) => m.annee === annee);
  if (trimestres.length === 0) return 0;
  let totalPondere = 0;
  let totalPoids = 0;
  trimestres.forEach((m) => {
    const poids = POIDS_TRIMESTRE[m.trimestre] ?? 1;
    totalPondere += m.moyenneGenerale * poids;
    totalPoids += poids;
  });
  return totalPoids > 0 ? Math.round((totalPondere / totalPoids) * 100) / 100 : 0;
}

/** Organise la fin d'année : seules la 3e et la Terminale (A/C/D) sont des
 * classes d'examen (BEPC / Baccalauréat), combinant la moyenne annuelle de
 * contrôle continu et une épreuve finale. Les autres niveaux (Seconde,
 * Première) ne passent aucun examen national : leur résultat de fin
 * d'année est simplement la moyenne annuelle des 3 trimestres. */
/** Applique l'épreuve d'examen (BEPC/Bac) ou la consolidation de moyenne
 * annuelle pour UN élève. Idempotent : si cet élève a déjà été traité cette
 * année (via un bouton par niveau ou un appel précédent), il est ignoré. */
/** Traite l'examen (BEPC/Bac) ou la consolidation annuelle d'UN élève,
 * avec un vrai barème à points :
 *  - chaque matière est notée séparément sur 20, avec son propre aléa ;
 *  - les points de chaque matière (note × coefficient) sont additionnés,
 *    pour un total sur 360 (BEPC, 3e) ou 400 (Bac, toutes séries) ;
 *  - la moyenne d'examen équivalente sur 20 est ce total divisé par la
 *    somme des coefficients ;
 *  - la moyenne d'orientation combine ensuite examen (poids 2) et moyenne
 *    de classe annuelle (poids 1) : (examen×2 + classe×1) / 3.
 * Idempotent : un élève déjà traité cette année n'est jamais repris. */
function traiterExamenEleve(session: Session, eleve: Eleve, rng: RNG): void {
  const derniere = eleve.moyennes[eleve.moyennes.length - 1];
  if (!derniere || derniere.annee !== session.anneeCourante.libelle) return;
  if (derniere.examenTraite) return; // déjà traité — on ne reprend pas deux fois

  const moyenneClasse = moyenneAnnuelleTrimestres(eleve, session.anneeCourante.libelle);
  let moyenneFinale = moyenneClasse;

  if (estNiveauExamen(eleve.niveau)) {
    const matieres = matieresDuNiveau(eleve.niveau);
    let totalPoints = 0;
    let totalCoefficients = 0;

    matieres.forEach((matiere) => {
      const coeff = coefficient(matiere.key, eleve.niveau);
      // Réutilise le moteur de cohérence des notes normales (plancher lié à
      // la compétence réelle, volatilité propre à l'élève, et possibilité
      // de "coup d'éclat" porté par le potentiel caché) — un examen est
      // légèrement plus exigeant qu'une évaluation ordinaire (1.15), mais
      // reste tiré par le même mécanisme, jamais un aléa déconnecté du
      // niveau réel de l'élève en classe.
      const noteEpreuve = genererNoteBrute(rng, eleve, matiere.key, 1.15);
      totalPoints += noteEpreuve * coeff;
      totalCoefficients += coeff;

      const entreeMatiere = derniere.parMatiere.find((p) => p.matiere === matiere.key);
      if (entreeMatiere) entreeMatiere.noteExamen = noteEpreuve;
    });

    const pointsMax = totalCoefficients * 20; // 360 (BEPC) ou 400 (Bac)
    const noteExamenSur20 = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

    // Moyenne d'orientation : examen pondéré ×2, moyenne de classe ×1
    moyenneFinale = Math.round(((noteExamenSur20 * 2 + moyenneClasse * 1) / 3) * 100) / 100;

    derniere.pointsExamen = Math.round(totalPoints * 10) / 10;
    derniere.pointsExamenMax = pointsMax;
  }

  eleve.competences.progression = calculerIndicateurProgression(eleve);
  derniere.moyenneGenerale = moyenneFinale;
  derniere.examenTraite = true;
}

/** Organise l'examen (BEPC/Bac ou consolidation annuelle) pour UN SEUL
 * niveau (ex: uniquement la 3e, ou uniquement la Terminale) — bouton dédié
 * par niveau. Ne fait pas avancer l'étape globale de la timeline : c'est le
 * bouton global "Organiser les examens" qui, une fois tous les niveaux
 * couverts (individuellement ou en bloc), fait passer à l'orientation. */
export function organiserExamenPourNiveau(session: Session, groupeCle: string): number {
  const groupe = listerGroupesNiveau(session).find((g) => g.cle === groupeCle);
  if (!groupe) return 0;

  const rng = rngDeSession(session, `EXAMEN-${groupeCle}-${session.anneeCourante.libelle}`);
  let traites = 0;

  groupe.classes.forEach((classe) => {
    classe.matricules.forEach((matricule) => {
      const eleve = session.eleves[matricule];
      if (!eleve || !estScolarise(eleve.statut)) return;
      const derniere = eleve.moyennes[eleve.moyennes.length - 1];
      if (derniere?.examenTraite) return;
      traiterExamenEleve(session, eleve, rng);
      traites++;
    });
  });

  return traites;
}

/** Organise l'examen de fin d'année pour TOUTE la génération (bouton
 * global) : BEPC pour la 3e, Baccalauréat pour la Terminale, consolidation
 * de la moyenne annuelle pour les autres niveaux. Idempotent — les niveaux
 * déjà traités individuellement via leur bouton dédié ne sont pas repris. */
export function simulerExamen(session: Session): void {
  const rng = rngDeSession(session, `EXAMEN-${session.anneeCourante.libelle}`);

  Object.values(session.eleves).forEach((eleve) => {
    if (!estScolarise(eleve.statut)) return;
    traiterExamenEleve(session, eleve, rng);
  });

  session.anneeCourante.etapeCourante = "orientation";
}

/** Applique l'orientation automatique de fin d'année (passage / redoublement / recalage / filière),
 * y compris pour les élèves déjà en post-bac : chaque cursus post-bac suit
 * désormais exactement le même moteur (notes, mentions, décision de
 * passage) que le secondaire, avec une durée fixe menant à un diplôme. */
/** Traite la décision de fin d'année (mention/bourse, passage,
 * redoublement, recalage, ou orientation/progression post-bac) pour UN
 * élève. Idempotent : un élève déjà traité cette année n'est jamais repris
 * — condition indispensable pour permettre un traitement niveau par
 * niveau (les niveaux n'ont pas tous le même processus, notamment le
 * post-bac, qui progresse d'année en année plutôt que de changer de
 * série). */
function traiterOrientationEleve(session: Session, eleve: Eleve, rng: RNG): void {
  if (!estScolarise(eleve.statut)) return;
  if (eleve.orientationAnneeTraitee === session.anneeCourante.libelle) return;
  eleve.orientationAnneeTraitee = session.anneeCourante.libelle;

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
    avancerUneAnneePostBac(eleve, session.anneeCourante.libelle, rng);
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
    eleve.serieBac = eleve.niveau === "TermC" ? "C" : eleve.niveau === "TermD" ? "D" : "A";
    const { niveau: destination, motif, excellence } = orienterPostBac(eleve, rng);
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
      eleve.specialiteIngenieur = choisirSpecialiteIngenieur(eleve, rng, "direct");
    }
    eleve.anneePostBac = 1;
  }
}

/** Applique l'orientation de fin d'année pour TOUTE la génération (bouton
 * global) — passage/redoublement/recalage pour le secondaire, progression
 * ou diplôme pour le post-bac — puis recompose les classes. Idempotent :
 * les niveaux déjà traités individuellement ne sont pas repris. */
export function simulerOrientation(session: Session): void {
  const rng = rngDeSession(session, `ORIENTATION-${session.anneeCourante.libelle}`);
  Object.values(session.eleves).forEach((eleve) => traiterOrientationEleve(session, eleve, rng));

  // Les diplômés déjà en poste évoluent dans leur carrière (promotion,
  // entrepreneuriat, expatriation, retraite) chaque année, indépendamment
  // du reste de la promotion.
  const rngCarriere = rngDeSession(session, `CARRIERE-${session.anneeCourante.libelle}`);
  Object.values(session.eleves).forEach((eleve) => {
    if ((eleve.statut === "diplome") && eleve.carriere) {
      avancerCarriereEleve(eleve, session.anneeCourante.libelle, rngCarriere);
    }
  });

  // Placements boursiers et achats de patrimoine des travailleurs les plus
  // aisés, indépendamment de leur évolution de carrière.
  const rngPatrimoine = rngDeSession(session, `PATRIMOINE-${session.anneeCourante.libelle}`);
  Object.values(session.eleves).forEach((eleve) => {
    if (eleve.statut === "diplome" && eleve.carriere) {
      avancerPatrimoineEleve(eleve, session.anneeCourante.libelle, rngPatrimoine);
    }
  });

  // Quelques mariages entre anciens élèves de la génération, chaque année.
  const rngMariage = rngDeSession(session, `MARIAGE-${session.anneeCourante.libelle}`);
  avancerMariages(session, session.anneeCourante.libelle, rngMariage);

  recomposerClasses(session);
  capturerSnapshotAnnee(session);
  session.anneeCourante.etapeCourante = "annee_suivante";
}

/** Applique l'orientation pour UN SEUL niveau (ex: uniquement la 3e, ou
 * uniquement l'École d'ingénieurs 1ère année) — bouton dédié par niveau.
 * Ne recompose pas les classes ni ne fait avancer l'étape globale : c'est
 * le bouton global qui s'en charge une fois tous les niveaux couverts. */
export function organiserOrientationPourNiveau(session: Session, groupeCle: string): number {
  const groupe = listerGroupesNiveau(session).find((g) => g.cle === groupeCle);
  if (!groupe) return 0;

  const rng = rngDeSession(session, `ORIENTATION-${groupeCle}-${session.anneeCourante.libelle}`);
  let traites = 0;
  groupe.classes.forEach((classe) => {
    classe.matricules.forEach((matricule) => {
      const eleve = session.eleves[matricule];
      if (!eleve) return;
      const dejaFait = eleve.orientationAnneeTraitee === session.anneeCourante.libelle;
      traiterOrientationEleve(session, eleve, rng);
      if (!dejaFait) traites++;
    });
  });

  return traites;
}

/** Durée (en années) de chaque cursus post-bac. Une classe préparatoire
 * scientifique (MPSI, Bio, Génie Civil) ou Commerce débouche sur un
 * concours à l'issue de ses 2 années — en cas de réussite, admission en
 * école d'ingénieurs ou de commerce (3 années de plus, cursus complet à 5
 * ans comme dans le système réel) ; en cas d'échec, repli sur l'université.
 * Chaque parcours se termine toujours par un diplôme, jamais un blocage
 * silencieux. */
const DUREE_POST_BAC: Partial<Record<Niveau, number>> = {
  PrepaScientifique: 2,
  PrepaBio: 2,
  PrepaGenieCivil: 2,
  PrepaCommerce: 2,
  PrepaLitteraire: 2,
  DUT: 2,
  Universite: 3,
  EcoleIngenieurs: 3, // 3 années après une prépa, 5 en admission directe
  EcoleCommerce: 3,
};

const PREPAS_CONCOURS_INGENIEUR: Niveau[] = ["PrepaScientifique", "PrepaBio", "PrepaGenieCivil"];

/** Probabilité de réussite au concours de fin de prépa, selon le niveau
 * atteint (moyenne de la dernière année) et le potentiel caché. */
function chanceReussiteConcours(eleve: Eleve): number {
  const moyenne = eleve.moyennes[eleve.moyennes.length - 1]?.moyenneGenerale ?? 10;
  const potMax = Math.max(eleve.potentiel.potentielScientifique, eleve.potentiel.potentielLitteraire);
  return clamp(0.3 + (moyenne - 10) * 0.05 + (potMax / 100) * 0.25, 0.15, 0.92);
}

/** Fait avancer d'une année un élève déjà engagé dans un cursus post-bac,
 * une fois sa décision de passage validée pour l'année (mêmes règles de
 * mention/redoublement que le secondaire) : passage à l'année suivante,
 * concours de fin de prépa (réussite ou repli), ou obtention du diplôme
 * final. */
function avancerUneAnneePostBac(eleve: Eleve, annee: string, rng: RNG): void {
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

  // Fin de prépa scientifique (MPSI, Bio, Génie Civil) -> concours d'entrée
  // en école d'ingénieurs, avec une vraie chance d'échec.
  if (PREPAS_CONCOURS_INGENIEUR.includes(eleve.niveau)) {
    const origine = eleve.niveau;
    const reussite = rng() < chanceReussiteConcours(eleve);
    if (reussite) {
      eleve.niveau = "EcoleIngenieurs";
      eleve.anneePostBac = 1;
      eleve.specialiteIngenieur = choisirSpecialiteIngenieur(eleve, rng, origine);
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: origine,
        niveauDestination: "EcoleIngenieurs",
        motif: `Admis(e) au concours à l'issue de ${NOM_NIVEAU[origine]} — intégration en école d'ingénieurs, spécialité ${eleve.specialiteIngenieur} (3 années restantes).`,
        scoreDetail: {},
      });
    } else {
      eleve.niveau = "Universite";
      eleve.anneePostBac = 1;
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: origine,
        niveauDestination: "Universite",
        motif: `Concours non validé à l'issue de ${NOM_NIVEAU[origine]} — poursuite en université.`,
        scoreDetail: {},
      });
    }
    return;
  }

  // Fin de Prépa Commerce -> concours d'entrée en école de commerce.
  if (eleve.niveau === "PrepaCommerce") {
    const reussite = rng() < chanceReussiteConcours(eleve);
    if (reussite) {
      eleve.niveau = "EcoleCommerce";
      eleve.anneePostBac = 1;
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: "PrepaCommerce",
        niveauDestination: "EcoleCommerce",
        motif: "Admis(e) au concours à l'issue de la Prépa Commerce — intégration en école de commerce (3 années restantes).",
        scoreDetail: {},
      });
    } else {
      eleve.niveau = "Universite";
      eleve.anneePostBac = 1;
      eleve.historiqueOrientation.push({
        annee,
        niveauOrigine: "PrepaCommerce",
        niveauDestination: "Universite",
        motif: "Concours non validé à l'issue de la Prépa Commerce — poursuite en université.",
        scoreDetail: {},
      });
    }
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

  // DUT, Université, École d'ingénieurs ou École de commerce achevés -> diplôme, fin de parcours
  eleve.statut = "diplome";
  eleve.historiqueOrientation.push({
    annee,
    niveauOrigine: eleve.niveau,
    niveauDestination: eleve.niveau,
    motif: `Diplômé — ${NOM_NIVEAU[eleve.niveau]} (cursus de ${duree} an${duree > 1 ? "s" : ""}).`,
    scoreDetail: {},
  });
  demarrerCarriere(eleve, rng, annee);
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

      // Jamais le mot "groupe" dans un nom de classe : le numéro est
      // accolé directement (ex: "Seconde C1", "1ère C2") pour le secondaire,
      // ou ajouté simplement en fin pour le post-bac (ex: "Université — 2e année 2").
      const nom =
        nbClasses > 1
          ? anneePostBacGroupe
            ? `${baseNom} ${i + 1}`
            : `${baseNom}${i + 1}`
          : baseNom;

      nouvellesClasses.push({
        id,
        nom,
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
