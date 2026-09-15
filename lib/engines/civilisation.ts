import type { Eleve, Session } from "../models/types";
import { assurerDirector, type DirectorState } from "./directeur";
import { getDeepState, type EnterpriseState, type DynastyState } from "./deepSimulation";
import { clamp, mulberry32 } from "../utils/random";

export type EraId = "fondation" | "expansion" | "acceleration" | "resilience" | "influence" | "renaissance";

export interface CorporationLegacy {
  id: string;
  nom: string;
  fondateur: string;
  secteur: string;
  valeur: number;
  emplois: number;
  generationDirigeante: number;
  statut: "active" | "licorne" | "faillite" | "transmise";
  successeur?: string;
  historique: { annee: string; texte: string; valeur: number }[];
}

export interface UniversityLegacy {
  id: string;
  nom: string;
  prestige: number;
  recherche: number;
  bourses: number;
  recrutements: number;
  rivalite: number;
}

export interface FamilyLegacy {
  id: string;
  nom: string;
  generation: number;
  influence: number;
  patrimoine: number;
  entreprises: number;
  membres: number;
  statut: "emergente" | "influente" | "dynastique";
}

export interface CivilizationEvent {
  id: string;
  annee: string;
  titre: string;
  texte: string;
  categorie: "economie" | "technologie" | "famille" | "entreprise" | "academie" | "crise";
  impact: number;
}

export interface CivilizationState {
  annee: number;
  era: EraId;
  titreEre: string;
  indiceCivilisation: number;
  entreprises: Record<string, CorporationLegacy>;
  universites: Record<string, UniversityLegacy>;
  familles: Record<string, FamilyLegacy>;
  evenements: CivilizationEvent[];
  anneesSimulees: number;
  successionRealisee: number;
  enfantsIntegres: number;
  patrimoineGlobal: number;
  influenceGlobale: number;
  compteurCrises: number;
  compteurInnovations: number;
}

const c = (n: number) => clamp(Math.round(n), 0, 100);
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const year = (s: Session) => Number(s.anneeCourante.libelle.slice(0, 4)) || 2026;

function patrimoine(e: Eleve) {
  return Math.max(0, (e.solde ?? 0) + (e.bourse?.valeur ?? 0) + (e.patrimoine ?? []).reduce((a, x) => a + (x.valeurAchat ?? 0), 0));
}

export function assurerCivilisation(session: Session): CivilizationState {
  const d = assurerDirector(session) as DirectorState;
  if (!d.civilisation) {
    d.civilisation = {
      annee: year(session), era: "fondation", titreEre: "L'âge de la fondation", indiceCivilisation: 50,
      entreprises: {}, universites: {}, familles: {}, evenements: [], anneesSimulees: 0,
      successionRealisee: 0, enfantsIntegres: 0, patrimoineGlobal: 0, influenceGlobale: 0,
      compteurCrises: 0, compteurInnovations: 0,
    };
  }
  d.civilisation.entreprises ??= {};
  d.civilisation.universites ??= {};
  d.civilisation.familles ??= {};
  d.civilisation.evenements ??= [];
  return d.civilisation;
}

function era(state: CivilizationState, world: DirectorState["world"]) {
  let id: EraId = "fondation";
  if (state.annee >= 2045 && world.technologie > 125) id = "expansion";
  if (state.annee >= 2055 && world.technologie > 145) id = "acceleration";
  if (world.cycle === "recession") id = "resilience";
  if (state.influenceGlobale > 78 && state.patrimoineGlobal > 2_000_000_000) id = "influence";
  if (state.indiceCivilisation >= 90) id = "renaissance";
  const titles: Record<EraId, string> = {
    fondation: "L'âge de la fondation", expansion: "L'âge de l'expansion", acceleration: "L'âge de l'accélération",
    resilience: "L'âge de la résilience", influence: "L'âge de l'influence", renaissance: "L'âge de la renaissance",
  };
  state.era = id; state.titreEre = titles[id];
}

function syncUniversities(state: CivilizationState, session: Session) {
  const defaults = [
    ["universite-excellence", "Université d'Excellence de l'Académie"],
    ["universite-sciences", "Institut des Sciences & Technologies"],
    ["universite-commerce", "École Supérieure des Affaires"],
    ["universite-monde", "Global Institute of Engineering"],
  ] as const;
  defaults.forEach(([id, nom], i) => {
    state.universites[id] ??= { id, nom, prestige: 68 + i * 4, recherche: 60 + i * 5, bourses: 4, recrutements: 0, rivalite: 35 + i * 5 };
    const u = state.universites[id];
    const world = assurerDirector(session).world;
    u.prestige = c(u.prestige + (world.technologie > 135 ? 2 : 1) - (world.cycle === "recession" ? 1 : 0));
    u.recherche = c(u.recherche + (world.technologie > 140 ? 2 : 0));
    if (u.prestige > 80) u.bourses += 1;
    if (u.prestige > 78) u.recrutements += Math.max(1, Math.round(u.prestige / 35));
  });
}

function syncFamilies(state: CivilizationState, session: Session) {
  const deep = getDeepState(session);
  Object.values(deep.dynasties).forEach((d: DynastyState) => {
    const id = d.id;
    const f = state.familles[id] ??= { id, nom: d.nom, generation: d.generation, influence: d.influence, patrimoine: d.patrimoine, entreprises: 0, membres: d.membres.length, statut: "emergente" };
    f.influence = Math.max(f.influence, d.influence);
    f.patrimoine = Math.max(f.patrimoine, d.patrimoine);
    f.membres = Math.max(f.membres, d.membres.length);
    f.generation = Math.max(f.generation, d.generation);
    f.statut = f.influence >= 85 || f.patrimoine >= 1_000_000_000 ? "dynastique" : f.influence >= 65 || f.patrimoine >= 250_000_000 ? "influente" : "emergente";
  });
}

function syncCorporations(state: CivilizationState, session: Session) {
  const deep = getDeepState(session);
  const world = assurerDirector(session).world;
  Object.values(deep.enterprises).forEach((e: EnterpriseState) => {
    const founder = session.eleves[e.fondateur];
    const id = e.id;
    const corp = state.entreprises[id] ??= {
      id, nom: e.nom, fondateur: e.fondateur, secteur: e.secteur, valeur: e.valeur, emplois: e.emplois,
      generationDirigeante: 1, statut: e.statut === "licorne" ? "licorne" : e.statut === "faillite" ? "faillite" : "active", historique: []
    };
    const growth = world.cycle === "boom" ? 0.10 : world.cycle === "recession" ? -0.06 : 0.035;
    corp.valeur = Math.max(0, Math.round(corp.valeur * (1 + growth)));
    corp.emplois = Math.max(1, Math.round(corp.emplois * (1 + growth / 2)));
    corp.statut = e.statut === "licorne" ? "licorne" : e.statut === "faillite" ? "faillite" : corp.generationDirigeante > 1 ? "transmise" : "active";
    if (corp.statut === "licorne") corp.valeur = Math.max(corp.valeur, 1_000_000_000);
    corp.historique.unshift({ annee: session.anneeCourante.libelle, texte: world.cycle === "recession" ? "Résistance à une année difficile" : "Croissance du groupe", valeur: corp.valeur });
    corp.historique = corp.historique.slice(0, 12);
    if (founder && founder.marie && founder.conjointMatricule && corp.generationDirigeante === 1) {
      const children: Array<{ id: string; statut: string; potentiel: number }> = Object.values((deep as any).legacy?.descendants ?? {}).filter((x: any) => x.parent1 === founder.matricule || x.parent2 === founder.matricule) as Array<{ id: string; statut: string; potentiel: number }>;
      const successor = children.sort((a: any, b: any) => b.potentiel - a.potentiel)[0];
      if (successor && successor.statut !== "hors-generation") {
        corp.successeur = successor.id;
        if (year(session) - Number(e.anneeCreation.slice(0,4)) >= 18) {
          corp.generationDirigeante = 2;
          corp.statut = "transmise";
          state.successionRealisee += 1;
          state.evenements.unshift({ id: `succ-${id}-${year(session)}`, annee: session.anneeCourante.libelle, titre: "🏢 Une entreprise change de génération", texte: `${corp.nom} prépare sa transmission à la génération suivante.`, categorie: "entreprise", impact: 8 });
        }
      }
    }
  });
}

function createWorldEvent(state: CivilizationState, session: Session) {
  const d = assurerDirector(session);
  const world = d.world;
  const y = session.anneeCourante.libelle;
  const key = `${y}-${world.cycle}-${world.technologie}`;
  if (state.evenements.some(e => e.id.startsWith(key))) return;
  let event: CivilizationEvent;
  if (world.cycle === "recession") {
    state.compteurCrises += 1;
    event = { id: key, annee: y, titre: "⚠️ Une crise teste la civilisation", texte: "Les familles solides, les entreprises résilientes et les institutions de formation amortissent le choc.", categorie: "crise", impact: -2 };
  } else if (world.technologie > 145) {
    state.compteurInnovations += 1;
    event = { id: key, annee: y, titre: "🤖 Une révolution technologique change les règles", texte: `Le secteur ${world.secteurFort} devient un moteur de mobilité sociale et économique.`, categorie: "technologie", impact: 5 };
  } else if (state.successionRealisee > 0 && state.successionRealisee % 3 === 0) {
    event = { id: key, annee: y, titre: "🧬 Une nouvelle dynastie économique apparaît", texte: "Le patrimoine, les entreprises et les réseaux commencent à se transmettre sur plusieurs générations.", categorie: "famille", impact: 7 };
  } else {
    event = { id: key, annee: y, titre: "🌍 Une année de transformation", texte: "Les trajectoires individuelles commencent à produire des effets collectifs sur la civilisation de l'Académie.", categorie: "academie", impact: 2 };
  }
  state.evenements.unshift(event);
  state.evenements = state.evenements.slice(0, 40);
}

export function simulerCivilisationAnnee(session: Session) {
  const state = assurerCivilisation(session);
  const d = assurerDirector(session);
  state.annee = year(session);
  syncUniversities(state, session);
  syncFamilies(state, session);
  syncCorporations(state, session);
  const deep = getDeepState(session);
  state.enfantsIntegres = Object.values((deep as any).legacy?.descendants ?? {}).filter((x: any) => x.statut === "integre").length;
  state.patrimoineGlobal = Math.round(Object.values(deep.alumni).reduce((a, x) => a + x.patrimoineEstime, 0) + Object.values(state.entreprises).reduce((a, x) => a + x.valeur, 0));
  state.influenceGlobale = c(Object.values(deep.alumni).reduce((a, x) => a + x.influence, 0) / Math.max(1, Object.keys(deep.alumni).length));
  state.indiceCivilisation = c(35 + state.influenceGlobale * 0.35 + Math.min(30, Object.keys(state.familles).length * 2) + Math.min(25, Object.keys(state.entreprises).length * 1.5) + d.reputAcademie * 0.15 - state.compteurCrises * 1.5 + state.compteurInnovations * 2);
  era(state, d.world);
  createWorldEvent(state, session);
  state.anneesSimulees += 1;
}

export function simulerCivilisationNAnnees(session: Session, n: number) {
  const count = Math.max(1, Math.min(10, Math.round(n)));
  for (let i = 0; i < count; i++) {
    const d = assurerDirector(session);
    // Simulation prospective : le monde avance, puis les moteurs existants vivent l'année.
    d.world.economie = clamp(d.world.economie + (i % 2 === 0 ? 1 : -1), 60, 160);
    simulerCivilisationAnnee(session);
  }
  return count;
}

export function getCivilizationState(session: Session) { return assurerCivilisation(session); }
