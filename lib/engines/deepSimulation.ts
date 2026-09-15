import type { Eleve, Session } from "../models/types";
import { assurerDirector, type DirectorState, type ProfilPsychologique, type Relation } from "./directeur";
import { clamp, mulberry32 } from "../utils/random";

export interface DestinyState {
  matricule: string;
  reputation: number;
  satisfaction: number;
  reseau: number;
  risque: number;
  influence: number;
  vocation?: string;
  archetype: "leader" | "expert" | "entrepreneur" | "chercheur" | "humaniste" | "explorateur" | "artisan";
  moments: { annee: string; titre: string; texte: string; impact: number }[];
  dernierBilan?: string;
  relations?: Record<string, Relation>;
  achievements?: { id: string; annee: string; titre: string }[];
}

export interface EnterpriseState {
  id: string;
  fondateur: string;
  nom: string;
  secteur: string;
  valeur: number;
  emplois: number;
  croissance: number;
  statut: "active" | "licorne" | "faillite";
  anneeCreation: string;
  historique: { annee: string; evenement: string; valeur: number }[];
}

export interface AlumniLegacy {
  matricule: string;
  nomComplet: string;
  metier: string;
  entreprise: string;
  secteur: string;
  influence: number;
  patrimoineEstime: number;
  distinction: string;
  anneeRetraite?: string;
  anneeDiplome: string;
}

export interface DynastyState {
  id: string;
  nom: string;
  membres: string[];
  influence: number;
  patrimoine: number;
  generation: number;
  devise: string;
}

export interface DeepState {
  destinies: Record<string, DestinyState>;
  enterprises: Record<string, EnterpriseState>;
  alumni: Record<string, AlumniLegacy>;
  dynasties: Record<string, DynastyState>;
  worldHistory: { annee: string; economie: number; technologie: number; emploi: number; secteur: string; headline: string }[];
  unlockedSecrets: string[];
  globalEvents: { id: string; annee: string; titre: string; texte: string }[];
  legacyScore: number;
}

const clamp100 = (n:number) => clamp(n,0,100);
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function ensureDeep(session:Session): DeepState {
  const d=assurerDirector(session) as DirectorState & { deep?: DeepState };
  if(!d.deep) d.deep={destinies:{},enterprises:{},alumni:{},dynasties:{},worldHistory:[],unlockedSecrets:[],globalEvents:[],legacyScore:0};
  d.deep.enterprises ??= {}; d.deep.alumni ??= {}; d.deep.dynasties ??= {}; d.deep.legacyScore ??= 0;
  return d.deep;
}
function psycho(session:Session,e:Eleve): ProfilPsychologique { return assurerDirector(session).psychologie[e.matricule]; }
function archetype(p:ProfilPsychologique): DestinyState["archetype"] {
  if(p.leadership>82&&p.ambition>78)return "leader";
  if(p.creativite>84&&p.ambition>70)return "entrepreneur";
  if(p.intelligenceAnalytique>84&&p.curiosite>78)return "chercheur";
  if(p.communication>75 && p.sociabilite>80)return "humaniste";
  if(p.curiosite>86)return "explorateur";
  if(p.discipline>84&&p.regularite>84)return "expert";
  return "artisan";
}
function ensureDestiny(session:Session,e:Eleve):DestinyState {
  const deep=ensureDeep(session); const p=psycho(session,e);
  if(!deep.destinies[e.matricule]) {
    const r=mulberry32(hash(`${session.seed}:destiny:${e.matricule}`));
    deep.destinies[e.matricule]={matricule:e.matricule,reputation:Math.round(30+r()*30),satisfaction:Math.round(55+r()*30),reseau:Math.round(20+r()*40),risque:Math.round(20+r()*30),influence:0,archetype:archetype(p),moments:[]};
  }
  return deep.destinies[e.matricule];
}
function moment(session:Session,e:Eleve,titre:string,texte:string,impact:number){
  const d=ensureDestiny(session,e); const annee=session.anneeCourante.libelle;
  if(d.moments.some(m=>m.annee===annee&&m.titre===titre))return;
  d.moments.unshift({annee,titre,texte,impact}); d.reputation=clamp100(d.reputation+impact); d.influence=clamp100(d.influence+Math.max(0,impact));
}
function relationEvolution(session:Session,e:Eleve,p:ProfilPsychologique){
  const dir=assurerDirector(session); const rel=dir.relations[e.matricule]; if(!rel)return;
  const peers=rel.amis.filter(id=>session.eleves[id]);
  const r=mulberry32(hash(`${session.seed}:relations:${session.anneeCourante.libelle}:${e.matricule}`));
  if(peers.length){ rel.score=clamp100(rel.score+(p.sociabilite>65?2:-1)); if(r()<0.08 && !rel.histoire.includes("Une amitié devient un réseau professionnel.")) rel.histoire.push("Une amitié devient un réseau professionnel."); }
  if(p.leadership>80&&rel.score>65) { rel.mentor=rel.mentor??(peers[0]); const target=dir.relations[peers[0]]; if(target){target.score=clamp100(target.score+1);target.histoire=target.histoire??[]; if(!target.histoire.includes("Un mentorat entre pairs se crée."))target.histoire.push("Un mentorat entre pairs se crée.");} }
  if(p.ambition>80&&rel.score<45){ rel.rival=peers[0]; if(!rel.histoire.includes("Une rivalité stimule les performances."))rel.histoire.push("Une rivalité stimule les performances."); }
}
function careerEvolution(session:Session,e:Eleve,d:DestinyState,p:ProfilPsychologique){
  if(!e.carriere)return;
  const world=assurerDirector(session).world;
  const fit = world.secteurFort.toLowerCase().includes(e.carriere.secteur.toLowerCase()) || e.carriere.secteur.toLowerCase().includes(world.secteurFort.toLowerCase());
  const stressPenalty=p.gestionStress<35?3:0;
  if(fit){d.satisfaction=clamp100(d.satisfaction+4);d.reputation=clamp100(d.reputation+3);moment(session,e,"Une opportunité de marché",`Le secteur ${world.secteurFort} devient porteur et valorise son expérience.`,2);}
  if(world.cycle==="recession"){d.risque=clamp100(d.risque+5);d.satisfaction=clamp100(d.satisfaction-2-stressPenalty);e.carriere.salaireMensuel=Math.round(e.carriere.salaireMensuel*0.985);}
  else {d.risque=clamp100(d.risque-2); if(fit)e.carriere.salaireMensuel=Math.round(e.carriere.salaireMensuel*1.025);}
  if(world.technologie>140 && /numérique|informatique|data|télécom/i.test(e.carriere.nom+" "+e.carriere.secteur)) e.carriere.salaireMensuel=Math.round(e.carriere.salaireMensuel*1.035);
  if(p.ambition>82&&p.leadership>78&&world.emploi>90) d.influence=clamp100(d.influence+4);
}
function studentYear(session:Session,e:Eleve){
  const dir=assurerDirector(session); const p=psycho(session,e); const d=ensureDestiny(session,e); relationEvolution(session,e,p);
  const avg=e.moyennes.at(-1)?.moyenneGenerale??0;
  const prev=e.moyennes.length>1?e.moyennes.at(-2)?.moyenneGenerale??avg:avg;
  const delta=avg-prev;
  if(avg>=18) moment(session,e,"Major de la promotion",`${e.prenom} ${e.nom} atteint ${avg.toFixed(2)}/20 et entre dans les annales.`,6);
  if(delta>=2.5) moment(session,e,"Décollage spectaculaire",`Une progression de ${delta.toFixed(1)} point(s) révèle un déclic important.`,5);
  if(delta<=-3) moment(session,e,"Année difficile",`Une baisse de ${Math.abs(delta).toFixed(1)} point(s) met sa résilience à l'épreuve.`,-2);
  if(p.creativite>88 && dir.world.technologie>125) moment(session,e,"L'innovation devient une vocation",`Le contexte technologique renforce son potentiel créatif.`,5);
  if(p.ambition>88&&p.leadership>85) moment(session,e,"Étoffe de leader",`Son influence dépasse progressivement le cadre scolaire.`,4);
  careerEvolution(session,e,d,p);
  updateEnterprise(session,e,d);
  updateLegacy(session,e,d);
  updateDynasty(session,e,d);
  if(e.statut==="diplome"&&e.carriere){
    if(d.influence>65&&p.ambition>85) moment(session,e,"Réseau d'influence",`Ses relations commencent à accélérer sa carrière.`,3);
  }
  d.achievements = d.achievements ?? [];
  d.achievements = d.achievements.filter((a,i,self)=>self.findIndex(x=>x.id===a.id&&x.annee===a.annee)===i);
}

function patrimoineEstime(e: Eleve): number {
  const actifs = (e.patrimoine ?? []).reduce((sum, a) => sum + (a.valeurAchat ?? 0), 0);
  const bourse = e.bourse?.valeur ?? 0;
  return Math.max(0, Math.round(actifs + bourse + e.solde));
}

function updateEnterprise(session: Session, e: Eleve, d: DestinyState) {
  if (!e.carriere || e.carriere.typeCarriere !== "entrepreneur") return;
  const deep = ensureDeep(session);
  const id = `ent-${e.matricule}`;
  const existing = deep.enterprises[id];
  const year = session.anneeCourante.libelle;
  const world = assurerDirector(session).world;
  const growthBase = world.cycle === "boom" ? 0.14 : world.cycle === "recession" ? -0.08 : 0.05;
  const leadership = psycho(session,e)?.leadership ?? 50;
  const growth = growthBase + (leadership - 50) / 1000;
  if (!existing) {
    deep.enterprises[id] = {
      id, fondateur: e.matricule, nom: e.carriere.entreprise, secteur: e.carriere.secteur,
      valeur: Math.max(5_000_000, e.carriere.salaireMensuel * 30), emplois: 2 + Math.floor(leadership / 20),
      croissance: Math.round(growth * 100), statut: "active", anneeCreation: e.carriere.anneeDebut,
      historique: [{annee: e.carriere.anneeDebut, evenement: "Création de l'entreprise", valeur: Math.max(5_000_000, e.carriere.salaireMensuel * 30)}]
    };
    return;
  }
  existing.valeur = Math.max(0, Math.round(existing.valeur * (1 + growth)));
  existing.emplois = Math.max(1, Math.round(existing.emplois * (1 + growth / 2)));
  existing.croissance = Math.round(growth * 100);
  if (existing.valeur > 1_000_000_000) existing.statut = "licorne";
  if (existing.valeur < 500_000 && world.cycle === "recession") existing.statut = "faillite";
  existing.historique.unshift({annee: year, evenement: existing.statut === "licorne" ? "🚀 Franchit le milliard FCFA" : world.cycle === "recession" ? "Résiste à la crise" : "Croissance annuelle", valeur: existing.valeur});
  existing.historique = existing.historique.slice(0,12);
  if(existing.statut === "licorne") { d.influence=clamp100(d.influence+5); d.reputation=clamp100(d.reputation+3); }
}

function updateLegacy(session: Session, e: Eleve, d: DestinyState) {
  if (!e.carriere || (e.statut !== "retraite" && e.statut !== "diplome")) return;
  const deep=ensureDeep(session); const year=session.anneeCourante.libelle;
  const influence=Math.round((d.influence + d.reputation) / 2);
  const patrimoine=patrimoineEstime(e);
  const distinction = influence >= 85 ? "Légende de l'Académie" : influence >= 70 ? "Grande figure" : influence >= 55 ? "Alumni remarquable" : "Ancien élève";
  deep.alumni[e.matricule] = {
    matricule:e.matricule, nomComplet:`${e.prenom} ${e.nom}`, metier:e.carriere.nom, entreprise:e.carriere.entreprise,
    secteur:e.carriere.secteur, influence, patrimoineEstime:patrimoine, distinction,
    anneeRetraite:e.statut === "retraite" ? year : undefined, anneeDiplome:e.carriere.anneeDebut
  };
  deep.legacyScore=clamp100(Math.round(Object.values(deep.alumni).reduce((a,x)=>a+x.influence,0)/Math.max(1,Object.keys(deep.alumni).length)));
}

function updateDynasty(session: Session, e: Eleve, d: DestinyState) {
  if(!e.marie || !e.conjointMatricule) return;
  const deep=ensureDeep(session); const ids=[e.matricule,e.conjointMatricule].sort(); const id=`dyn-${ids.join("-")}`;
  const other=session.eleves[e.conjointMatricule];
  const influence=Math.round((d.influence + (other ? ensureDestiny(session,other).influence : 0)) / 2);
  const patrimoine=patrimoineEstime(e)+(other ? patrimoineEstime(other) : 0);
  const nom=`Famille ${e.nom}`;
  deep.dynasties[id] ??= {id,nom,membres:ids,influence:0,patrimoine:0,generation:1,devise:"Construire, transmettre, inspirer."};
  const dyn=deep.dynasties[id]; dyn.influence=Math.max(dyn.influence,influence); dyn.patrimoine=Math.max(dyn.patrimoine,patrimoine);
  if(dyn.influence>=80 || dyn.patrimoine>=500_000_000) dyn.devise="Une génération prépare la suivante.";
  d.influence=clamp100(d.influence+(dyn.influence>=80?2:0));
}

function globalEvent(session:Session){
  const dir=assurerDirector(session); const deep=ensureDeep(session); const year=session.anneeCourante.libelle;
  if(deep.worldHistory.some(x=>x.annee===year))return;
  deep.worldHistory.push({annee:year,economie:dir.world.economie,technologie:dir.world.technologie,emploi:dir.world.emploi,secteur:dir.world.secteurFort,headline:dir.world.headline});
  const id=dir.world.cycle==="recession"?"recession":dir.world.technologie>135?"tech":dir.world.cycle==="boom"?"boom":"normal";
  const texts:Record<string,[string,string]>={
    recession:["⚠️ La grande année de résilience","Le marché ralentit. Les profils disciplinés, polyvalents et bien entourés résistent mieux."],
    tech:["🤖 Accélération technologique","Le numérique transforme les métiers. Plusieurs élèves peuvent bénéficier d'une reconversion ou d'une vocation nouvelle."],
    boom:["📈 Boom des opportunités","Le marché crée des postes et des projets. Les ambitions fortes peuvent se transformer en carrières exceptionnelles."],
    normal:["🌍 Le monde continue de bouger","Une année sans choc majeur, mais chaque trajectoire reste sensible aux choix individuels."]
  };
  const [titre,texte]=texts[id]; deep.globalEvents.unshift({id:`${id}-${year}`,annee:year,titre,texte});
  if(session.modeJeu === "histoire"){
    if(id!=="normal") dir.score+=8;
  }
}
export function initialiserDeepSimulation(session:Session){
  ensureDeep(session); Object.values(session.eleves).forEach(e=>ensureDestiny(session,e));
}
export function simulerDestineesAnnee(session:Session){
  initialiserDeepSimulation(session); const deep=ensureDeep(session); const dir=assurerDirector(session);
  globalEvent(session);
  Object.values(session.eleves).forEach(e=>{if(["actif","redoublant","universite","diplome"].includes(e.statut))studentYear(session,e);});
  // Secrets émergents : le jeu ne les révèle que lorsqu'ils deviennent crédibles.
  const secrets=[
    ["genie-discret",Object.values(session.eleves).some(e=>(e.moyennes.at(-1)?.moyenneGenerale??0)<12&&(psycho(session,e)?.intelligenceAnalytique??0)>88)],
    ["futur-entrepreneur",Object.values(session.eleves).some(e=>{const p=psycho(session,e);return p?.creativite>90&&p.ambition>82})],
    ["leader-generation",Object.values(session.eleves).some(e=>{const p=psycho(session,e);return p?.leadership>92&&p.ambition>88})],
    ["survivant-recession",dir.world.cycle==="recession"&&Object.values(session.eleves).some(e=>(psycho(session,e)?.resilience??0)>90)],
  ] as [string,boolean][];
  secrets.forEach(([id,ok])=>{if(ok&&!deep.unlockedSecrets.includes(id)){deep.unlockedSecrets.push(id);dir.score+=15;dir.journal.unshift({id:`secret-${id}-${session.anneeCourante.libelle}`,annee:session.anneeCourante.libelle,title:"🔓 Secret de génération découvert",body:`Un nouveau potentiel caché vient d'être révélé : ${id.replaceAll("-"," ")}.`,type:"story"});}});
  // En mode histoire, les objectifs deviennent progressivement plus exigeants.
  if(session.modeJeu==="histoire"){
    const completed=dir.missions.filter(m=>m.completed).length;
    if(completed>=3)dir.reputAcademie=clamp100(dir.reputAcademie+2);
  }
  deep.destinies && Object.values(deep.destinies).forEach(x=>x.dernierBilan=`${x.reputation}/100 réputation · ${x.influence}/100 influence · ${x.satisfaction}/100 satisfaction`);
}
export function getDeepState(session:Session):DeepState{return ensureDeep(session);}
export function scoreDestinee(session:Session,e:Eleve){const d=ensureDestiny(session,e);return d.reputation+d.influence*.6+d.satisfaction*.25-d.risque*.2;}
