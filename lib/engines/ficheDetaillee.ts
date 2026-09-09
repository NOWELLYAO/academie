import { Eleve, MoyenneTrimestre, Session, SubjectKey } from "../models/types";
import { MATIERES } from "../data/subjects";

export interface CelluleMatiereTrimestre {
  trimestre: 1 | 2 | 3;
  moyenne: number | null;
  rangClasse: number | null;
  totalClasse: number;
  rangNiveau: number | null;
  totalNiveau: number;
}

export interface CelluleExamen {
  note: number;
  rangClasse: number | null;
  totalClasse: number;
  rangNiveau: number | null;
  totalNiveau: number;
}

export interface LigneMatiereDetaillee {
  matiere: SubjectKey;
  nom: string;
  coefficient: number;
  parTrimestre: CelluleMatiereTrimestre[];
  moyenneAnnuelle: number | null;
  examen: CelluleExamen | null;
}

export interface AnneeDetaillee {
  annee: string;
  niveau: string;
  classeNom: string;
  estExamen: boolean;
  libelleExamen: string | null;
  lignes: LigneMatiereDetaillee[];
}

export interface OptionAnnee {
  annee: string;
  label: string;
  doublant: boolean;
}

/** Liste les années scolaires disponibles pour un élève, dans l'ordre
 * chronologique, avec un libellé lisible (classe + année). */
export function listerAnneesDisponibles(eleve: Eleve): OptionAnnee[] {
  const annees = Array.from(new Set(eleve.moyennes.map((m) => m.annee))).sort();
  return annees.map((annee) => {
    const entree = eleve.moyennes.find((m) => m.annee === annee);
    const doublant = eleve.historiqueOrientation.some(
      (o) => o.annee === annee && o.niveauDestination === "redoublement"
    );
    return {
      annee,
      label: `${entree?.classeNom ?? annee} — ${annee}`,
      doublant,
    };
  });
}

const POIDS_TRIMESTRE: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 2 };

function rangDansGroupe(
  session: Session,
  matricule: string,
  matiere: SubjectKey,
  trimestre: number,
  annee: string,
  appartientAuGroupe: (entree: MoyenneTrimestre) => boolean
): { rang: number | null; total: number } {
  const candidats = Object.values(session.eleves)
    .map((e) => {
      const entree = e.moyennes.find((m) => m.trimestre === trimestre && m.annee === annee);
      if (!entree || !appartientAuGroupe(entree)) return null;
      const mm = entree.parMatiere.find((p) => p.matiere === matiere);
      return mm ? { matricule: e.matricule, moyenne: mm.moyenne } : null;
    })
    .filter((x): x is { matricule: string; moyenne: number } => x !== null)
    .sort((a, b) => b.moyenne - a.moyenne);

  const idx = candidats.findIndex((c) => c.matricule === matricule);
  return { rang: idx === -1 ? null : idx + 1, total: candidats.length };
}

/** Comme rangDansGroupe, mais pour la note d'examen (BEPC/Bac/session
 * post-bac) — un seul point par élève et par année, pas par trimestre. */
function rangExamenDansGroupe(
  session: Session,
  matricule: string,
  matiere: SubjectKey,
  annee: string,
  appartientAuGroupe: (entree: MoyenneTrimestre) => boolean
): { rang: number | null; total: number } {
  const candidats = Object.values(session.eleves)
    .map((e) => {
      const entreesAnnee = e.moyennes.filter((m) => m.annee === annee).sort((a, b) => a.trimestre - b.trimestre);
      const entree = entreesAnnee[entreesAnnee.length - 1];
      if (!entree || !entree.pointsExamenMax || !appartientAuGroupe(entree)) return null;
      const mm = entree.parMatiere.find((p) => p.matiere === matiere);
      return mm && mm.noteExamen !== undefined ? { matricule: e.matricule, note: mm.noteExamen } : null;
    })
    .filter((x): x is { matricule: string; note: number } => x !== null)
    .sort((a, b) => b.note - a.note);

  const idx = candidats.findIndex((c) => c.matricule === matricule);
  return { rang: idx === -1 ? null : idx + 1, total: candidats.length };
}

/** Construit la fiche détaillée (toutes matières, tous trimestres, avec
 * rangs classe et niveau) d'un élève pour UNE année scolaire donnée. */
export function construireAnneeDetaillee(
  session: Session,
  eleve: Eleve,
  annee: string
): AnneeDetaillee | null {
  const entrees = eleve.moyennes.filter((m) => m.annee === annee).sort((a, b) => a.trimestre - b.trimestre);
  if (entrees.length === 0) return null;

  const derniere = entrees[entrees.length - 1];
  const classeNom = derniere.classeNom;
  const niveau = derniere.niveau;
  const estExamen = !!derniere.pointsExamenMax;
  const libelleExamen = derniere.pointsExamenMax === 360 ? "BEPC" : derniere.pointsExamenMax === 400 ? "Bac" : estExamen ? "Session" : null;

  const matieresPresentes = new Set<SubjectKey>();
  entrees.forEach((e) => e.parMatiere.forEach((p) => matieresPresentes.add(p.matiere)));

  const lignes: LigneMatiereDetaillee[] = MATIERES.filter((m) => matieresPresentes.has(m.key)).map(
    (m) => {
      const parTrimestre: CelluleMatiereTrimestre[] = ([1, 2, 3] as const).map((t) => {
        const entree = entrees.find((e) => e.trimestre === t);
        const mm = entree?.parMatiere.find((p) => p.matiere === m.key);
        if (!mm || !entree) {
          return { trimestre: t, moyenne: null, rangClasse: null, totalClasse: 0, rangNiveau: null, totalNiveau: 0 };
        }
        const rc = rangDansGroupe(session, eleve.matricule, m.key, t, annee, (e) => e.classeNom === classeNom);
        const rn = rangDansGroupe(session, eleve.matricule, m.key, t, annee, (e) => e.niveau === niveau);
        return {
          trimestre: t,
          moyenne: mm.moyenne,
          rangClasse: rc.rang,
          totalClasse: rc.total,
          rangNiveau: rn.rang,
          totalNiveau: rn.total,
        };
      });

      let totalPondere = 0;
      let totalPoids = 0;
      parTrimestre.forEach((c) => {
        if (c.moyenne !== null) {
          totalPondere += c.moyenne * POIDS_TRIMESTRE[c.trimestre];
          totalPoids += POIDS_TRIMESTRE[c.trimestre];
        }
      });

      const mmDerniere = derniere.parMatiere.find((p) => p.matiere === m.key);
      const examen =
        estExamen && mmDerniere?.noteExamen !== undefined
          ? (() => {
              const rc = rangExamenDansGroupe(session, eleve.matricule, m.key, annee, (e) => e.classeNom === classeNom);
              const rn = rangExamenDansGroupe(session, eleve.matricule, m.key, annee, (e) => e.niveau === niveau);
              return {
                note: mmDerniere.noteExamen!,
                rangClasse: rc.rang,
                totalClasse: rc.total,
                rangNiveau: rn.rang,
                totalNiveau: rn.total,
              };
            })()
          : null;

      return {
        matiere: m.key,
        nom: m.nom,
        coefficient: derniere.parMatiere.find((p) => p.matiere === m.key)?.coefficient ?? 1,
        parTrimestre,
        moyenneAnnuelle: totalPoids > 0 ? Math.round((totalPondere / totalPoids) * 100) / 100 : null,
        examen,
      };
    }
  );

  return { annee, niveau, classeNom, estExamen, libelleExamen, lignes };
}
