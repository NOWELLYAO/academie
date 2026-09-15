import type { Eleve, Session } from "../models/types";
import { assurerDirector } from "./directeur";
import { getDeepState, type DeepState } from "./deepSimulation";
import { clamp, mulberry32 } from "../utils/random";

export interface InstitutionState {
  id: string;
  nom: string;
  type: "universite" | "entreprise" | "laboratoire" | "fondation";
  prestige: number;
  partenariat: number;
  active: boolean;
  anneeDebut: string;
  domaines: string[];
}

export interface PartnerState {
  id: string;
  nom: string;
  type: "universite" | "entreprise" | "fondation";
  prestige: number;
  recrutements: number;
  bourses: number;
  alumni: number;
  derniereAction: string;
}

export interface DescendantState {
  id: string;
  parent1?: string;
  parent2?: string;
  nomComplet: string;
  famille: string;
  generation: number;
  anneeNaissance: string;
  potentiel: number;
  curiosite: number;
  discipline: number;
  creativite: number;
  ambition: number;
  reseauFamilial: number;
  patrimoineHerite: number;
  vocation?: string;
  statut: "hors-generation" | "candidat" | "integre";
}

export interface LegacyGeneration {
  id: string;
  nom: string;
  generation: number;
  anneeDebut: string;
  anneeFin?: string;
  ancetreGenerationId?: string;
  descendants: string[];
  total: number;
  moyenneEntree: number;
  prestige: number;
  statut: "active" | "archivee";
}

export interface LegacyState {
  institutions: Record<string, InstitutionState>;
  partners: Record<string, PartnerState>;
  descendants: Record<string, DescendantState>;
  generations: Record<string, LegacyGeneration>;
  generationActiveId?: string;
  heritageTotal: number;
  transmissionScore: number;
  worldMilestones: { annee: string; titre: string; texte: string; impact: number }[];
}

const clamp100 = (n: number) => clamp(n, 0, 100);
const year = (s: Session) => s.anneeCourante.libelle;
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

function state(session: Session): LegacyState {
  const deep = getDeepState(session) as DeepState & { legacy?: LegacyState };
  if (!deep.legacy) {
    deep.legacy = {
      institutions: {}, partners: {}, descendants: {}, generations: {},
      heritageTotal: 0, transmissionScore: 0, worldMilestones: []
    };
  }
  deep.legacy.institutions ??= {};
  deep.legacy.partners ??= {};
  deep.legacy.descendants ??= {};
  deep.legacy.generations ??= {};
  deep.legacy.worldMilestones ??= [];
  return deep.legacy;
}

function patrimoine(e: Eleve) {
  return Math.max(0, Math.round((e.solde ?? 0) + (e.bourse?.valeur ?? 0) + (e.patrimoine ?? []).reduce((a, x) => a + (x.valeurAchat ?? 0), 0)));
}

function ensureInstitutions(session: Session) {
  const s = state(session);
  const defaults: InstitutionState[] = [
    { id: "univ-excellence", nom: "Université d’Excellence de l’Académie", type: "universite", prestige: 78, partenariat: 55, active: true, anneeDebut: year(session), domaines: ["ingénierie", "sciences", "commerce"] },
    { id: "lab-innovation", nom: "Laboratoire Génération Innovation", type: "laboratoire", prestige: 72, partenariat: 48, active: true, anneeDebut: year(session), domaines: ["IA", "énergie", "eau", "industrie"] },
    { id: "fondation-alumni", nom: "Fondation des Anciens", type: "fondation", prestige: 68, partenariat: 42, active: true, anneeDebut: year(session), domaines: ["bourses", "mentorat", "entrepreneuriat"] },
    { id: "hub-entreprises", nom: "Alliance Entreprises & Académie", type: "entreprise", prestige: 70, partenariat: 50, active: true, anneeDebut: year(session), domaines: ["emploi", "stages", "innovation"] },
  ];
  defaults.forEach(x => { if (!s.institutions[x.id]) s.institutions[x.id] = x; });
}

function ensurePartners(session: Session) {
  const s = state(session);
  ensureInstitutions(session);
  Object.values(s.institutions).forEach(i => {
    const id = `partner-${i.id}`;
    s.partners[id] ??= { id, nom: i.nom, type: i.type === "laboratoire" ? "entreprise" : i.type, prestige: i.prestige, recrutements: 0, bourses: 0, alumni: 0, derniereAction: "Partenariat créé" };
  });
}

function descendantsFromMarriages(session: Session) {
  const s = state(session);
  const married = Object.values(session.eleves).filter(e => e.marie && e.conjointMatricule && e.carriere);
  married.forEach(e => {
    const other = e.conjointMatricule ? session.eleves[e.conjointMatricule] : undefined;
    if (!other || e.matricule > other.matricule) return;
    const family = `Famille ${e.nom}`;
    const id = `child-${[e.matricule, other.matricule].sort().join("-")}`;
    if (s.descendants[id]) return;
    const rng = mulberry32(hash(`${session.seed}:${id}`));
    const wealth = Math.round((patrimoine(e) + patrimoine(other)) * (0.08 + rng() * 0.12));
    const p1 = 45 + Math.round(rng() * 50), p2 = 45 + Math.round(rng() * 50);
    const potential = clamp100(Math.round((p1 + p2) / 2));
    s.descendants[id] = {
      id, parent1: e.matricule, parent2: other.matricule,
      nomComplet: `Enfant de ${e.prenom} ${e.nom} & ${other.prenom} ${other.nom}`,
      famille: family, generation: 2, anneeNaissance: year(session), potentiel: potential,
      curiosite: clamp100(40 + Math.round(rng() * 60)), discipline: clamp100(40 + Math.round(rng() * 60)),
      creativite: clamp100(40 + Math.round(rng() * 60)), ambition: clamp100(40 + Math.round(rng() * 60)),
      reseauFamilial: clamp100(Math.round((ensureInfluence(session, e) + ensureInfluence(session, other)) / 2)),
      patrimoineHerite: wealth, statut: "hors-generation"
    };
  });
}

function ensureInfluence(session: Session, e: Eleve) {
  const deep = getDeepState(session);
  return deep.destinies[e.matricule]?.influence ?? 0;
}

function createGeneration(session: Session) {
  const s = state(session);
  if (s.generationActiveId) return;
  const id = `generation-${session.id}-1`;
  s.generations[id] = { id, nom: session.nomSession, generation: 1, anneeDebut: session.anneeDepart, descendants: [], total: Object.keys(session.eleves).length, moyenneEntree: 0, prestige: 50, statut: "active" };
  s.generationActiveId = id;
}

function evolvePartners(session: Session) {
  const s = state(session), dir = assurerDirector(session);
  Object.values(s.partners).forEach(p => {
    const fit = dir.world.technologie > 125 && /innovation|université|laboratoire/i.test(p.nom);
    p.prestige = clamp100(p.prestige + (fit ? 2 : dir.world.cycle === "recession" ? -1 : 1));
    const alumni = Object.values(getDeepState(session).alumni).filter(a => a.entreprise === p.nom || a.secteur.toLowerCase().includes(p.type)).length;
    p.alumni = alumni;
    if (p.prestige >= 80) p.recrutements += Math.max(1, Math.round(p.prestige / 30));
    if (p.prestige >= 75 && dir.world.cycle !== "recession") p.bourses += 1;
    p.derniereAction = fit ? "Accélération du partenariat technologique" : "Partenariat maintenu";
  });
}

export function simulerLegacyAnnee(session: Session) {
  const s = state(session);
  ensurePartners(session);
  createGeneration(session);
  descendantsFromMarriages(session);
  evolvePartners(session);

  const dir = assurerDirector(session);
  const deep = getDeepState(session);
  const yearNow = year(session);
  const retired = Object.values(session.eleves).filter(e => e.statut === "retraite");
  const alumniWealth = Object.values(deep.alumni).reduce((a, x) => a + x.patrimoineEstime, 0);
  s.heritageTotal = Math.round(alumniWealth + Object.values(s.descendants).reduce((a, x) => a + x.patrimoineHerite, 0));
  const prestigeMoyen = Object.values(s.partners).reduce((a: number, x: PartnerState) => a + x.prestige, 0) / Math.max(1, Object.keys(s.partners).length);
  s.transmissionScore = clamp100(Math.round((prestigeMoyen + Math.min(100, Object.keys(s.descendants).length * 4)) / 2));

  if (retired.length > 0 && !s.worldMilestones.some(x => x.annee === yearNow && x.titre === "Première vague de transmission")) {
    s.worldMilestones.unshift({ annee: yearNow, titre: "Première vague de transmission", texte: `${retired.length} anciens commencent à transmettre leurs réseaux, capitaux et savoir-faire à la génération suivante.`, impact: 8 });
  }
  if (dir.world.technologie >= 140 && !s.worldMilestones.some(x => x.annee === yearNow && x.titre === "Révolution technologique")) {
    s.worldMilestones.unshift({ annee: yearNow, titre: "Révolution technologique", texte: "Les anciens élèves et partenaires accélèrent les investissements dans les nouveaux métiers.", impact: 10 });
  }
  if (dir.world.cycle === "recession" && !s.worldMilestones.some(x => x.annee === yearNow && x.titre === "Crise mondiale")) {
    s.worldMilestones.unshift({ annee: yearNow, titre: "Crise mondiale", texte: "Les patrimoines les plus solides financent des bourses et protègent les jeunes talents.", impact: 6 });
  }

  const gen = s.generationActiveId ? s.generations[s.generationActiveId] : undefined;
  if (gen) {
    gen.prestige = clamp100(Math.round((deep.legacyScore + s.transmissionScore + dir.reputAcademie) / 3));
    gen.total = Object.keys(session.eleves).length;
  }
  deep.legacyScore = clamp100(Math.round((deep.legacyScore * 0.7) + (s.transmissionScore * 0.3)));
}

export function preparerGenerationSuivante(session: Session): number {
  const s = state(session);
  descendantsFromMarriages(session);
  const candidates = Object.values(s.descendants).filter(x => x.statut === "hors-generation").slice(0, 120);
  candidates.forEach(x => x.statut = "candidat");
  const id = `generation-${session.id}-${Object.keys(s.generations).length + 1}`;
  const avg = candidates.length ? Math.round(candidates.reduce((a, x) => a + x.potentiel + x.reseauFamilial, 0) / (2 * candidates.length)) : 0;
  s.generations[id] = { id, nom: `${session.nomSession} · Génération ${Object.keys(s.generations).length + 1}`, generation: Object.keys(s.generations).length + 1, anneeDebut: year(session), descendants: candidates.map(x => x.id), total: candidates.length, moyenneEntree: avg, prestige: s.transmissionScore, statut: "active", ancetreGenerationId: s.generationActiveId };
  if (s.generationActiveId) s.generations[s.generationActiveId].statut = "archivee";
  s.generationActiveId = id;
  candidates.forEach(x => x.statut = "integre");
  return candidates.length;
}

export function getLegacyState(session: Session): LegacyState { return state(session); }
