import type { Eleve, GameActionId, GameObjective, GameState, Session } from "../models/types";
import { assurerDirector } from "./directeur";
import { clamp } from "../utils/random";

const chapters = [
  { n: 1, title: "La première étincelle", objectives: [
    ["talent", "Détecter une étoile", "Obtenir 1 élève protégé.", 1, 0, 1000],
    ["observe", "Connaître sa promotion", "Observer au moins 5 élèves.", 5, 0, 1000],
  ]},
  { n: 2, title: "Le déclic", objectives: [
    ["coach", "Faire progresser un talent", "Utiliser 2 séances de coaching.", 2, 0, 1500],
    ["score", "Dépasser 1000 points", "Construire une dynamique positive.", 1000, 0, 1500],
  ]},
  { n: 3, title: "La culture d'excellence", objectives: [
    ["excellent", "Créer 10 excellents", "Atteindre 10 élèves à 15/20 ou plus.", 10, 0, 2500],
    ["defi", "Oser le défi", "Lancer 3 défis.", 3, 0, 2000],
  ]},
  { n: 4, title: "Les talents cachés", objectives: [
    ["protect", "Former un réseau", "Protéger 5 élèves.", 5, 0, 3000],
    ["project", "Faire naître une idée", "Lancer 2 projets étudiants.", 2, 0, 2500],
  ]},
  { n: 5, title: "Le premier sommet", objectives: [
    ["reputation", "Devenir une référence", "Atteindre 65/100 de réputation.", 65, 0, 4000],
    ["actions", "Jouer intelligemment", "Réaliser 15 actions significatives.", 15, 0, 3000],
  ]},
  { n: 6, title: "Le monde change", objectives: [
    ["crisis", "Traverser un choc", "Traverser un boom ou une récession.", 1, 0, 5000],
    ["adapt", "S'adapter", "Utiliser une bourse ou un programme de soutien.", 2, 0, 3500],
  ]},
  { n: 7, title: "Les bâtisseurs", objectives: [
    ["project5", "Pépinière de projets", "Lancer 5 projets étudiants.", 5, 0, 6000],
    ["leader", "Faire émerger un leader", "Avoir un profil de leadership très élevé.", 80, 0, 5000],
  ]},
  { n: 8, title: "Le réseau", objectives: [
    ["mentor", "Construire des passerelles", "Atteindre 5 mentorats.", 5, 0, 7000],
    ["international", "Ouvrir les portes", "Atteindre 70/100 d'ouverture internationale.", 70, 0, 6000],
  ]},
  { n: 9, title: "La grande épreuve", objectives: [
    ["contest", "Marquer les esprits", "Lancer 3 concours.", 3, 0, 8000],
    ["success", "Maintenir l'excellence", "Atteindre 90% de réussite.", 90, 0, 7000],
  ]},
  { n: 10, title: "Le rayonnement", objectives: [
    ["reputation80", "Rayonner", "Atteindre 80/100 de réputation.", 80, 0, 10000],
    ["score5000", "Devenir légendaire", "Atteindre 5 000 points.", 5000, 0, 10000],
  ]},
  { n: 11, title: "L'héritage", objectives: [
    ["legacy", "Laisser une trace", "Faire émerger 10 trajectoires remarquables.", 10, 0, 12000],
    ["world", "Influencer le monde", "Faire évoluer la civilisation sur plusieurs années.", 3, 0, 10000],
  ]},
  { n: 12, title: "La légende", objectives: [
    ["hall", "Construire une génération historique", "Atteindre 90/100 de réputation.", 90, 0, 25000],
    ["master", "Maîtriser les destins", "Atteindre 10 000 points.", 10000, 0, 25000],
  ]},
] as const;

function chapterData(n: number) { return chapters[Math.max(0, Math.min(chapters.length - 1, n - 1))]; }

export function creerGameState(): GameState {
  const c = chapterData(1);
  return {
    actionPoints: 3, maxActionPoints: 3, actionsUsed: 0, combo: 0, score: 0,
    chapter: 1, chapterTitle: c.title,
    objectives: c.objectives.map(([id, titre, description, cible, progression, reward]) => ({ id, chapitre: 1, titre, description, cible, progression, reward, complete: false })),
    completedObjectives: [], actionLog: [], unlocked: ["observer", "coacher", "defi"], streak: 0,
  };
}

export function assurerJeu(session: Session): GameState {
  if (!session.jeu) session.jeu = creerGameState();
  session.jeu.maxActionPoints = session.modeJeu === "ironman" ? 2 : 3;
  session.jeu.actionPoints = Math.min(session.jeu.actionPoints, session.jeu.maxActionPoints);
  return session.jeu;
}

function activeStudents(session: Session) { return Object.values(session.eleves).filter(e => ["actif", "redoublant", "universite"].includes(e.statut)); }
function avg(e: Eleve) { return e.moyennes.at(-1)?.moyenneGenerale ?? 0; }
function bestCandidate(session: Session) { return activeStudents(session).sort((a,b) => avg(b)-avg(a))[0]; }

export function executerAction(session: Session, action: GameActionId, matricule?: string): { ok: boolean; message: string } {
  const g = assurerJeu(session);
  if (g.actionPoints <= 0) return { ok: false, message: "Plus de points d'action pour cette étape." };
  const d = assurerDirector(session);
  const target = matricule ? session.eleves[matricule] : bestCandidate(session);
  if (!target) return { ok: false, message: "Aucun élève disponible." };
  const p = d.psychologie[target.matricule];
  const r = d.relations[target.matricule];
  let titre = "Action"; let effet = ""; let delta = 0;
  if (action === "observer") {
    titre = "Observation stratégique"; effet = `${target.prenom} ${target.nom} devient un profil prioritaire à surveiller.`; delta = 40;
    if (!g.unlocked.includes("bourse")) g.unlocked.push("bourse");
  } else if (action === "coacher") {
    titre = "Coaching individuel"; target.assiduite = clamp(target.assiduite + 4, 0, 100); target.competences.progression += 5; if (p) { p.discipline = clamp(p.discipline + 3,0,100); p.resilience = clamp(p.resilience + 3,0,100); } delta = 90;
    effet = `${target.prenom} gagne en régularité et en résilience.`;
  } else if (action === "defi") {
    titre = "Défi de haut niveau"; target.competences.progression += 8; if(p) { p.gestionStress=clamp(p.gestionStress+2,0,100); p.ambition=clamp(p.ambition+4,0,100); } delta = 130;
    effet = `${target.prenom} est placé face à une difficulté qui peut accélérer sa trajectoire.`;
  } else if (action === "bourse") {
    const cost = 1_000_000;
    if (d.budget < cost) return { ok:false, message:"Budget insuffisant pour cette bourse." };
    d.budget -= cost; target.solde += 350_000; target.boursier = true; if(p) p.resilience=clamp(p.resilience+6,0,100); delta=150; titre="Bourse de rupture"; effet=`Une aide financière évite qu'une contrainte extérieure bloque ${target.prenom}.`;
  } else if (action === "projet") {
    if (d.budget < 500_000) return {ok:false,message:"Budget insuffisant pour lancer le projet."};
    d.budget -= 500_000; if(p) { p.creativite=clamp(p.creativite+6,0,100); p.leadership=clamp(p.leadership+3,0,100); } delta=180; titre="Projet étudiant"; effet=`${target.prenom} transforme une idée en prototype.`;
    if(!g.unlocked.includes("concours"))g.unlocked.push("concours");
  } else {
    delta=200; titre="Concours stratégique"; effet=`${target.prenom} est exposé à une compétition qui peut accélérer sa réputation.`; if(r) r.score=clamp(r.score+5,0,100);
  }
  g.actionPoints--; g.actionsUsed++; g.combo++; g.streak++; g.score += delta + Math.min(g.combo,5)*10;
  d.score += Math.round(delta/10); d.reputAcademie=clamp(d.reputAcademie + (delta>=150?1:0),0,100);
  if(action === "coacher" && g.streak >= 3) d.reputAcademie=clamp(d.reputAcademie+1,0,100);
  g.actionLog.unshift({id:`${Date.now()}-${g.actionsUsed}`,annee:session.anneeCourante.libelle,etape:session.anneeCourante.etapeCourante,action,titre,cible:target.matricule,effet,score:delta});
  actualiserObjectifs(session);
  return {ok:true,message:effet};
}

export function nouvelleEtapeJeu(session: Session) {
  const g=assurerJeu(session); g.actionPoints=g.maxActionPoints; g.actionsUsed=0; g.combo=0; g.streak=0; actualiserObjectifs(session);
}

function actualiserObjectifs(session: Session) {
  const g=assurerJeu(session); const d=assurerDirector(session); const students=activeStudents(session); const excellent=students.filter(e=>avg(e)>=15).length;
  const projects=g.actionLog.filter(x=>x.action==="projet").length; const contests=session.concours?.length??0; const coaches=g.actionLog.filter(x=>x.action==="coacher").length; const challenges=g.actionLog.filter(x=>x.action==="defi").length; const observed=g.actionLog.filter(x=>x.action==="observer").length; const scholarships=g.actionLog.filter(x=>x.action==="bourse").length; const mentorCount=Object.values(d.relations).filter(x=>x.mentor).length; const leaders=Math.max(0,...Object.values(d.psychologie).map(x=>x.leadership));
  g.objectives.forEach(o=>{
    if(o.id==="talent")o.progression=d.protectedStudents.length; else if(o.id==="observe")o.progression=observed; else if(o.id==="coach")o.progression=coaches; else if(o.id==="score")o.progression=g.score; else if(o.id==="excellent")o.progression=excellent; else if(o.id==="defi")o.progression=challenges; else if(o.id==="protect")o.progression=d.protectedStudents.length; else if(o.id==="project"||o.id==="project5")o.progression=projects; else if(o.id==="reputation"||o.id==="reputation80"||o.id==="hall")o.progression=d.reputAcademie; else if(o.id==="actions")o.progression=g.actionLog.length; else if(o.id==="adapt")o.progression=scholarships; else if(o.id==="leader")o.progression=leaders; else if(o.id==="mentor")o.progression=mentorCount; else if(o.id==="international")o.progression=d.world.international; else if(o.id==="score5000"||o.id==="master")o.progression=g.score; else if(o.id==="crisis")o.progression=(d.world.cycle==="boom"||d.world.cycle==="recession")?1:0; else if(o.id==="success")o.progression=students.length?Math.round(students.filter(e=>avg(e)>=10).length/students.length*100):0; else if(o.id==="world")o.progression=Math.min(3, new Set(g.actionLog.map(x=>x.annee)).size); else if(o.id==="contest")o.progression=contests; else if(o.id==="legacy")o.progression=students.filter(e=>e.carriere||e.statut==="retraite").length>10?10:0;
    if(!o.complete && o.progression>=o.cible){o.complete=true; if(!g.completedObjectives.includes(o.id)) {g.completedObjectives.push(o.id); g.score+=o.reward; d.budget+=o.reward; d.reputAcademie=clamp(d.reputAcademie+2,0,100);}}
  });
  const current=chapterData(g.chapter); if(g.objectives.length && g.objectives.every(o=>o.complete) && g.chapter<chapters.length){g.chapter++; const next=chapterData(g.chapter); g.chapterTitle=next.title; g.objectives=next.objectives.map(([id,titre,description,cible,progression,reward])=>({id,titre,description,cible,progression,reward,complete:false,chapitre:g.chapter})); g.unlocked.push(`chapter-${g.chapter}`); d.journal.unshift({id:`chapter-${g.chapter}-${Date.now()}`,annee:session.anneeCourante.libelle,title:`📖 Chapitre ${g.chapter} — ${g.chapterTitle}`,body:"De nouveaux objectifs sont disponibles.",type:"story"});}
  if(g.chapter===chapters.length && g.objectives.every(o=>o.complete)) g.victory=true;
}
