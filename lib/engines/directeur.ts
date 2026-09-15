import { Eleve, Session } from "../models/types";
import { clamp, mulberry32, randInt, randRange } from "../utils/random";

export type DecisionId = "soutien" | "excellence" | "laboratoire" | "mentorat" | "orientation" | "international" | "bourses" | "innovation";
export type ChoiceId = "soutien" | "enseignant" | "defi" | "observer" | "mentor" | "laisser";
export type DecisionResult = { id: DecisionId; title: string; cost: number; effect: string; applied: boolean };

export interface ProfilPsychologique {
  intelligenceAnalytique: number; communication: number; creativite: number; discipline: number; curiosite: number;
  leadership: number; sociabilite: number; resilience: number; gestionStress: number;
  ambition: number; autonomie: number; regularite: number;
}
export interface Relation { amis: string[]; rival?: string; mentor?: string; score: number; histoire: string[] }
export interface WorldState {
  economie: number; technologie: number; emploi: number; international: number; coutVie: number;
  secteurFort: string; headline: string; cycle: "croissance" | "normal" | "recession" | "boom";
}
export interface NarrativeChoice { id: ChoiceId; label: string; description: string; consequence: string }
export interface PendingEvent {
  id: string; annee: string; title: string; body: string; icon: string; matricule?: string;
  choices: NarrativeChoice[]; resolved: boolean; chosenId?: ChoiceId;
}
export interface Mission { id: string; title: string; description: string; target: number; progress: number; reward: number; completed: boolean }
export interface FacilitiesState {
  laboratoire: number; bibliotheque: number; numerique: number; sport: number; langues: number; orientation: number; accompagnement: number;
}
export interface StoryState {
  chapitre: number; titre: string; objectifs: { id: string; titre: string; description: string; cible: number; progression: number; complete: boolean }[];
}
export interface DirectorState {
  budget: number; budgetInitial: number; reputAcademie: number; anneeDerniereDecision?: string;
  decisions: { annee: string; id: DecisionId; cost: number; effect: string }[];
  psychologie: Record<string, ProfilPsychologique>; relations: Record<string, Relation>; world: WorldState;
  missions: Mission[]; achievements: { id: string; title: string; description: string; annee: string }[];
  journal: { id: string; annee: string; title: string; body: string; type: "success" | "warning" | "story" }[];
  protectedStudents: string[]; pendingEvent?: PendingEvent; score: number; generationYear: number; facilities: FacilitiesState; story: StoryState;
  deep?: import("./deepSimulation").DeepState;
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
const active = (e: Eleve) => ["actif", "redoublant", "universite"].includes(e.statut);

export function creerDirectorState(session: Session): DirectorState {
  const psychologie: Record<string, ProfilPsychologique> = {};
  const relations: Record<string, Relation> = {};
  const students = Object.values(session.eleves);
  students.forEach((e) => {
    const r = mulberry32(hash(session.seed + ":psych:" + e.matricule));
    const base = (e.potentiel.potentielScientifique + e.potentiel.potentielLitteraire) / 2;
    const discipline = clamp(e.competences.regularite + randRange(r, -15, 15), 5, 100);
    psychologie[e.matricule] = {
      intelligenceAnalytique: Math.round(clamp(base + randRange(r, -18, 18), 10, 100)),
      communication: Math.round(randRange(r, 25, 95)), creativite: Math.round(randRange(r, 20, 95)),
      discipline: Math.round(discipline), curiosite: Math.round(randRange(r, 25, 100)), leadership: Math.round(randRange(r, 10, 95)),
      sociabilite: Math.round(randRange(r, 20, 100)), resilience: Math.round(clamp(e.potentiel.resilience * 100 + randRange(r, -10, 10), 5, 100)),
      gestionStress: Math.round(randRange(r, 25, 95)), ambition: Math.round(randRange(r, 15, 100)),
      autonomie: Math.round(randRange(r, 25, 100)), regularite: Math.round(discipline),
    };
    relations[e.matricule] = { amis: [], score: Math.round(randRange(r, 35, 75)), histoire: [] };
  });
  students.forEach((e) => {
    const r = mulberry32(hash("rel:" + session.seed + ":" + e.matricule));
    const peers = students.filter((x) => x.matricule !== e.matricule && x.classeId === e.classeId);
    const amis: string[] = [];
    for (let i = 0; i < Math.min(3, peers.length); i++) amis.push(peers[Math.floor(r() * peers.length)].matricule);
    relations[e.matricule].amis = [...new Set(amis)];
  });
  return {
    budget: 50_000_000, budgetInitial: 50_000_000, reputAcademie: 50, decisions: [], psychologie, relations,
    world: { economie: 100, technologie: 100, emploi: 100, international: 50, coutVie: 100, secteurFort: "Ingénierie", cycle: "normal", headline: "Une nouvelle génération commence son parcours." },
    missions: [
      { id: "major", title: "Faire émerger un major", description: "Obtenir un élève à 18/20 ou plus.", target: 18, progress: 0, reward: 2_000_000, completed: false },
      { id: "excellence", title: "Pépinière d'excellence", description: "Avoir 25 élèves au-dessus de 15/20.", target: 25, progress: 0, reward: 3_000_000, completed: false },
      { id: "reussite", title: "Académie solide", description: "Atteindre 85 % de réussite.", target: 85, progress: 0, reward: 4_000_000, completed: false },
      { id: "talents", title: "Détecteurs de talents", description: "Protéger 5 élèves prometteurs.", target: 5, progress: 0, reward: 2_500_000, completed: false },
      { id: "reputation", title: "Académie de référence", description: "Atteindre 75/100 de réputation.", target: 75, progress: 0, reward: 5_000_000, completed: false },
    ],
    achievements: [], journal: [], protectedStudents: [], score: 0, generationYear: Number(session.anneeDepart.slice(0, 4)) || 2026,
    facilities: { laboratoire: 20, bibliotheque: 20, numerique: 20, sport: 20, langues: 15, orientation: 15, accompagnement: 15 },
    story: { chapitre: 1, titre: "La fondation", objectifs: [
      { id: "reputation", titre: "Ne laisser personne décrocher", description: "Atteindre 75/100 de réputation.", cible: 75, progression: 50, complete: false },
      { id: "talent", titre: "Identifier la première étoile", description: "Protéger 5 élèves prometteurs.", cible: 5, progression: 0, complete: false },
      { id: "excellence", titre: "Installer une culture d'excellence", description: "Réussir une mission d'excellence.", cible: 1, progression: 0, complete: false },
    ] },
  };
}
export function assurerDirector(session: Session): DirectorState {
  if (!session.directeur) session.directeur = creerDirectorState(session);
  const d = session.directeur;
  d.facilities ??= { laboratoire: 20, bibliotheque: 20, numerique: 20, sport: 20, langues: 15, orientation: 15, accompagnement: 15 };
  d.story ??= { chapitre: 1, titre: "La fondation", objectifs: [] };
  d.story.objectifs ??= [];
  return d;
}

export function appliquerDecision(session: Session, id: DecisionId): DecisionResult {
  const d = assurerDirector(session); const annee = session.anneeCourante.libelle;
  const actions: Record<DecisionId, Omit<DecisionResult,"applied">> = {
    soutien:{id,title:"Plan de soutien",cost:5_000_000,effect:"Les élèves fragiles gagnent en assiduité, résilience et progression."},
    excellence:{id,title:"Programme d'excellence",cost:8_000_000,effect:"Les meilleurs profils bénéficient d'un accélérateur scientifique."},
    laboratoire:{id,title:"Laboratoire & innovation",cost:12_000_000,effect:"Créativité, informatique et attractivité progressent."},
    mentorat:{id,title:"Réseau de mentorat",cost:6_000_000,effect:"Leadership, réseau et résilience progressent chez les ambitieux."},
    orientation:{id,title:"Cellule d'orientation",cost:4_000_000,effect:"Les orientations sont mieux alignées avec les aptitudes latentes."},
    international:{id,title:"Programme international",cost:10_000_000,effect:"L'ouverture internationale et les opportunités futures augmentent."},
    bourses:{id,title:"Fonds de bourses",cost:7_000_000,effect:"Les élèves à risque financier reçoivent un filet de sécurité."},
    innovation:{id,title:"Incubateur étudiant",cost:15_000_000,effect:"Les profils créatifs peuvent transformer leurs idées en projets."},
  };
  const action = actions[id];
  if (d.budget < action.cost || d.anneeDerniereDecision === annee) return {...action,applied:false};
  d.budget -= action.cost; d.anneeDerniereDecision = annee; d.decisions.push({annee,id,cost:action.cost,effect:action.effect});
  Object.values(session.eleves).forEach(e=>{ const p=d.psychologie[e.matricule]; if(!p) return;
    if(id==="soutien" && (e.competences.mathematiques<11 || e.competences.francais<11)){e.assiduite=clamp(e.assiduite+7,0,100);e.potentiel.resilience=clamp(e.potentiel.resilience+.04,0,1);}
    if(id==="excellence" && (e.moyennes.at(-1)?.moyenneGenerale??0)>=14)e.competences.progression+=8;
    if(id==="laboratoire"){e.competences.informatique=clamp(e.competences.informatique+.7,0,20);p.creativite=clamp(p.creativite+6,0,100);}
    if(id==="mentorat"&&p.ambition>65){p.leadership=clamp(p.leadership+8,0,100);e.potentiel.resilience=clamp(e.potentiel.resilience+.05,0,1);}
    if(id==="orientation")e.potentiel.capaciteApprentissage=clamp(e.potentiel.capaciteApprentissage+.03,0,1);
    if(id==="international")p.curiosite=clamp(p.curiosite+8,0,100);
    if(id==="bourses" && e.solde<100000)p.resilience=clamp(p.resilience+5,0,100);
    if(id==="innovation")p.creativite=clamp(p.creativite+10,0,100);
  });
  const facilityMap: Partial<Record<DecisionId, keyof FacilitiesState>> = { laboratoire: "laboratoire", innovation: "laboratoire", orientation: "orientation", mentorat: "accompagnement", international: "langues", soutien: "accompagnement", excellence: "bibliotheque", bourses: "accompagnement" };
  const facility = facilityMap[id];
  if (facility) d.facilities[facility] = clamp(d.facilities[facility] + 12, 0, 100);
  d.reputAcademie=clamp(d.reputAcademie+(id==="laboratoire"||id==="innovation"?5:2),0,100); d.score+=20;
  actualiserStory(session);
  d.journal.unshift({id:`${annee}-${id}-${d.decisions.length}`,annee,title:action.title,body:action.effect,type:"success"});
  return {...action,applied:true};
}

export function faireAvancerMonde(session: Session) {
  const d=assurerDirector(session); const r=mulberry32(hash(`${session.seed}:${session.anneeCourante.libelle}:world`));
  d.world.economie=clamp(d.world.economie+randInt(r,-8,8),55,145); d.world.technologie=clamp(d.world.technologie+randInt(r,2,10),90,180);
  d.world.emploi=clamp(80+(d.world.economie-100)*.45+randInt(r,-5,5),40,125); d.world.international=clamp(d.world.international+randInt(r,-4,7),25,100); d.world.coutVie=clamp(d.world.coutVie+randInt(r,1,7),80,180);
  const secteurs=["Ingénierie","Numérique","Énergie","Santé","Finance","Industrie","Agriculture","Construction"]; d.world.secteurFort=secteurs[Math.floor(r()*secteurs.length)];
  d.world.cycle=d.world.economie>120?"boom":d.world.economie<82?"recession":d.world.economie>105?"croissance":"normal";
  d.world.headline=d.world.cycle==="boom"?`Boom économique : ${d.world.secteurFort} recrute fortement.`:d.world.cycle==="recession"?"Ralentissement économique : la résilience et les compétences deviennent déterminantes.":d.world.technologie>130?`Accélération technologique : ${d.world.secteurFort} devient stratégique.`:`Le marché se transforme : ${d.world.secteurFort} gagne en importance.`;
  d.journal.unshift({id:`world-${session.anneeCourante.libelle}`,annee:session.anneeCourante.libelle,title:"Le monde évolue",body:d.world.headline,type:"story"});
}

function pickStudent(session: Session, predicate:(e:Eleve)=>boolean): Eleve|undefined { return Object.values(session.eleves).filter(e=>active(e)&&predicate(e)).sort((a,b)=>(b.moyennes.at(-1)?.moyenneGenerale??0)-(a.moyennes.at(-1)?.moyenneGenerale??0))[0]; }
export function genererEvenementNarratif(session: Session) {
  const d=assurerDirector(session); if(d.pendingEvent && !d.pendingEvent.resolved) return;
  const r=mulberry32(hash(`${session.seed}:${session.anneeCourante.libelle}:event:${session.anneeCourante.etapeCourante}`));
  const meilleur=pickStudent(session,e=>(e.moyennes.at(-1)?.moyenneGenerale??0)>=14);
  const fragile=pickStudent(session,e=>(e.moyennes.at(-1)?.moyenneGenerale??20)<11);
  const creative=pickStudent(session,e=>(d.psychologie[e.matricule]?.creativite??0)>80);
  const templates=[
    meilleur?{id:"talent",title:"🔎 Un talent attire l'attention",body:`Les résultats de ${meilleur.prenom} ${meilleur.nom} révèlent un potentiel remarquable. Le corps enseignant hésite entre l'exposer davantage ou le laisser mûrir.`,icon:"🔎",matricule:meilleur.matricule,choices:[{id:"defi",label:"Lancer un défi d'excellence",description:"Une épreuve difficile mais formatrice.",consequence:"Potentiel de progression élevé, avec une petite hausse de stress."},{id:"mentor",label:"Nommer un mentor",description:"Un accompagnement individualisé.",consequence:"Résilience et leadership progressent."},{id:"observer",label:"Observer encore",description:"Ne pas intervenir trop vite.",consequence:"Aucune dépense, mais l'opportunité peut passer."}]}:null,
    fragile?{id:"fragile",title:"🛟 Une situation préoccupante",body:`${fragile.prenom} ${fragile.nom} montre des signes de décrochage. Une intervention peut changer sa trajectoire.`,icon:"🛟",matricule:fragile.matricule,choices:[{id:"soutien",label:"Soutien intensif",description:"Mettre en place un accompagnement immédiat.",consequence:"Assiduité et résilience progressent."},{id:"enseignant",label:"Changer le référent",description:"Confier le suivi à un enseignant différent.",consequence:"Forte chance de déclic, mais coût organisationnel."},{id:"observer",label:"Surveiller",description:"Attendre le prochain bilan.",consequence:"Risque de décrochage accru."}]}:null,
    creative?{id:"innovation",title:"💡 Une idée inattendue",body:`${creative.prenom} ${creative.nom} propose un projet qui pourrait représenter l'Académie lors d'un concours.`,icon:"💡",matricule:creative.matricule,choices:[{id:"defi",label:"Financer le prototype",description:"Transformer l'idée en projet.",consequence:"Créativité et réputation progressent."},{id:"mentor",label:"Créer une équipe",description:"Associer deux élèves complémentaires.",consequence:"Réseau et leadership progressent."},{id:"observer",label:"Reporter",description:"Attendre une idée plus mature.",consequence:"Aucun coût, mais le projet peut s'essouffler."}]}:null,
  ].filter(Boolean) as PendingEvent[];
  const event=templates.length?templates[Math.floor(r()*templates.length)]:undefined;
  if(event)d.pendingEvent={...event,resolved:false};
}
export function resoudreEvenement(session: Session, choice: ChoiceId): boolean {
  const d=assurerDirector(session); const ev=d.pendingEvent; if(!ev||ev.resolved)return false; const e=ev.matricule?session.eleves[ev.matricule]:undefined; const p=e?d.psychologie[e.matricule]:undefined;
  if(e&&p){ if(choice==="soutien"){e.assiduite=clamp(e.assiduite+6,0,100);p.resilience=clamp(p.resilience+5,0,100);} if(choice==="enseignant"){p.gestionStress=clamp(p.gestionStress+4,0,100);e.competences.progression+=4;} if(choice==="defi"){e.competences.progression+=6;p.gestionStress=clamp(p.gestionStress-3,0,100);} if(choice==="mentor"){p.leadership=clamp(p.leadership+6,0,100);p.resilience=clamp(p.resilience+4,0,100);if(!d.relations[e.matricule])d.relations[e.matricule]={amis:[],score:50,histoire:[]};d.relations[e.matricule].mentor="ACADEMY";} }
  if(choice==="soutien")d.reputAcademie=clamp(d.reputAcademie+1,0,100); if(choice==="defi"||choice==="mentor")d.score+=10;
  ev.resolved=true;ev.chosenId=choice; const option=ev.choices.find(c=>c.id===choice); d.journal.unshift({id:`resolved-${ev.id}-${Date.now()}`,annee:ev.annee,title:`Décision : ${ev.title}`,body:option?.consequence??"Décision enregistrée.",type:"success"}); return true;
}

export function protegerEleve(session: Session, matricule: string): boolean { const d=assurerDirector(session); if(!session.eleves[matricule])return false; if(d.protectedStudents.includes(matricule)){d.protectedStudents=d.protectedStudents.filter(x=>x!==matricule);return true;} if(d.protectedStudents.length>=10)return false; d.protectedStudents.push(matricule); d.score+=5; return true; }

export function actualiserStory(session: Session) {
  const d = assurerDirector(session);
  d.story.objectifs.forEach(o => {
    if (o.id === "reputation") o.progression = d.reputAcademie;
    if (o.id === "talent") o.progression = d.protectedStudents.length;
    if (o.id === "excellence") o.progression = d.missions.find(m => m.id === "excellence")?.completed ? 1 : 0;
    if (!o.complete && o.progression >= o.cible) {
      o.complete = true; d.score += 30;
      d.journal.unshift({id:`story-${o.id}-${session.anneeCourante.libelle}`,annee:session.anneeCourante.libelle,title:`📖 Chapitre accompli : ${o.titre}`,body:o.description,type:"story"});
    }
  });
  if (session.modeJeu === "histoire" && d.story.objectifs.length > 0 && d.story.objectifs.every(o => o.complete)) {
    d.story.chapitre += 1;
    d.story.titre = d.story.chapitre === 2 ? "Le rayonnement" : d.story.chapitre === 3 ? "La légende" : "Nouvelle ère";
    d.story.objectifs = [
      {id:`rep-${d.story.chapitre}`,titre:"Faire rayonner l'Académie",description:"Dépasser 80/100 de réputation.",cible:80,progression:d.reputAcademie,complete:d.reputAcademie>=80},
      {id:`world-${d.story.chapitre}`,titre:"S'adapter au monde",description:"Faire face à un changement économique majeur.",cible:1,progression:d.world.cycle === "recession" || d.world.cycle === "boom" ? 1 : 0,complete:d.world.cycle === "recession" || d.world.cycle === "boom"},
      {id:`protect-${d.story.chapitre}`,titre:"Construire un réseau",description:"Atteindre 10 élèves protégés.",cible:10,progression:d.protectedStudents.length,complete:d.protectedStudents.length>=10},
    ];
  }
}

export function actualiserMissions(session: Session) {
  const d=assurerDirector(session); const students=Object.values(session.eleves); const moy=students.map(e=>e.moyennes.at(-1)?.moyenneGenerale??0); const best=Math.max(0,...moy); const excellent=moy.filter(x=>x>=15).length; const taux=moy.length?Math.round(moy.filter(x=>x>=10).length/moy.length*100):0;
  d.missions.forEach(m=>{if(m.id==="major")m.progress=best;if(m.id==="excellence")m.progress=excellent;if(m.id==="reussite")m.progress=taux;if(m.id==="talents")m.progress=d.protectedStudents.length;if(m.id==="reputation")m.progress=d.reputAcademie;if(!m.completed&&m.progress>=m.target){m.completed=true;d.budget+=m.reward;d.reputAcademie=clamp(d.reputAcademie+5,0,100);d.achievements.unshift({id:m.id,title:m.title,description:m.description,annee:session.anneeCourante.libelle});d.score+=50;d.journal.unshift({id:`mission-${m.id}-${session.anneeCourante.libelle}`,annee:session.anneeCourante.libelle,title:`Mission accomplie : ${m.title}`,body:`Récompense : ${m.reward.toLocaleString("fr-FR")} FCFA`,type:"success"});}});
}
