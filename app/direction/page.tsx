"use client";
import Link from "next/link";
import { useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import { DecisionId } from "@/lib/engines/directeur";
const decisions: { id: DecisionId; icon: string; title: string; cost: number; text: string }[] = [
  { id: "soutien", icon: "🛟", title: "Plan de soutien", cost: 5_000_000, text: "Aide les élèves fragiles à rebondir." },
  { id: "excellence", icon: "🏆", title: "Programme d'excellence", cost: 8_000_000, text: "Accélère les meilleurs profils." },
  { id: "laboratoire", icon: "🧪", title: "Laboratoire & innovation", cost: 12_000_000, text: "Développe créativité et numérique." },
  { id: "mentorat", icon: "🤝", title: "Réseau de mentorat", cost: 6_000_000, text: "Renforce leadership et résilience." },
  { id: "orientation", icon: "🧭", title: "Cellule d'orientation", cost: 4_000_000, text: "Améliore l'adéquation études/profil." },
  { id: "international", icon: "🌍", title: "Programme international", cost: 10_000_000, text: "Ouvre les élèves aux opportunités internationales." },
  { id: "bourses", icon: "🎓", title: "Fonds de bourses", cost: 7_000_000, text: "Protège les élèves fragiles financièrement." },
  { id: "innovation", icon: "🚀", title: "Incubateur étudiant", cost: 15_000_000, text: "Transforme les idées créatives en projets." },
];
const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
export default function DirectionPage() {
  const session = useAcademyStore((s) => s.session); const appliquer = useAcademyStore((s) => s.appliquerDecisionDirecteur); const preparer = useAcademyStore((s) => s.preparerAnneeDirecteur);
  useEffect(() => { if (session && !session.directeur) preparer(); }, [session, preparer]);
  if (!session) return <div className="p-8 text-sm">Aucune session. <Link className="border-b border-gold" href="/">Créer une génération →</Link></div>;
  const d = session.directeur; if (!d) return <div className="p-8 text-sm">Le moteur de direction sera initialisé à la prochaine session.</div>;
  const active = Object.values(session.eleves).filter(e => e.statut === "actif" || e.statut === "redoublant"); const best = Math.max(0, ...active.map(e => e.moyennes.at(-1)?.moyenneGenerale ?? 0));
  return <div className="p-5 md:p-10 max-w-7xl"><PageHeader eyebrow="Direction stratégique" title="Le destin de l'Académie" description="Vous ne suivez plus seulement la génération : vous influencez son avenir." />
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      <div className="border border-line bg-white/70 p-5"><div className="text-[10px] uppercase tracking-wide text-slate">Budget disponible</div><div className="font-display text-2xl mt-2">{money(d.budget)}</div></div>
      <div className="border border-line bg-white/70 p-5"><div className="text-[10px] uppercase tracking-wide text-slate">Réputation</div><div className="font-display text-2xl mt-2">{d.reputAcademie}/100</div></div>
      <div className="border border-line bg-white/70 p-5"><div className="text-[10px] uppercase tracking-wide text-slate">Meilleure note</div><div className="font-display text-2xl mt-2">{best.toFixed(2)}/20</div></div>
      <div className="border border-line bg-ink text-paper p-5"><div className="text-[10px] uppercase tracking-wide text-gold">Monde</div><div className="font-display text-xl mt-2">{d.world.secteurFort}</div><div className="text-xs text-paper/60 mt-1">Économie {Math.round(d.world.economie)} · emploi {Math.round(d.world.emploi)}</div></div>
    </div>
    <div className="border border-gold bg-gold-soft/30 p-5 mb-8"><div className="text-[10px] uppercase tracking-[.15em] text-slate">🌍 Actualité du monde</div><div className="font-display text-xl text-ink mt-1">{d.world.headline}</div><p className="text-sm text-slate mt-2">Technologie {Math.round(d.world.technologie)} · International {Math.round(d.world.international)} · Coût de la vie {Math.round(d.world.coutVie)}</p></div>
    <section className="mb-10"><div className="flex items-end justify-between mb-3"><div><h2 className="font-display text-xl">Décisions du directeur</h2><p className="text-xs text-slate mt-1">Une grande décision stratégique par année scolaire.</p></div><span className="text-xs text-slate">Année {session.anneeCourante.libelle}</span></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{decisions.map(x => <button key={x.id} onClick={() => appliquer(x.id)} disabled={d.budget < x.cost || d.anneeDerniereDecision === session.anneeCourante.libelle} className="text-left border border-line bg-white/70 p-5 hover:border-ink disabled:opacity-40 transition-colors"><div className="text-2xl">{x.icon}</div><div className="font-medium mt-3">{x.title}</div><p className="text-sm text-slate mt-1 leading-relaxed">{x.text}</p><div className="mt-4 text-xs font-medium">{money(x.cost)} →</div></button>)}</div>
    </section>
    <div className="grid lg:grid-cols-2 gap-8"><section><h2 className="font-display text-xl mb-3">🎯 Missions</h2><div className="space-y-3">{d.missions.map(m => <div key={m.id} className="border border-line bg-white/70 p-4"><div className="flex justify-between gap-3"><div><div className="font-medium">{m.completed ? "✓ " : ""}{m.title}</div><div className="text-xs text-slate mt-1">{m.description}</div></div><div className="text-xs font-medium">+{money(m.reward)}</div></div><div className="mt-3 h-2 bg-line/40 overflow-hidden"><div className="h-full bg-ink" style={{width:`${Math.min(100, m.progress / m.target * 100)}%`}} /></div><div className="text-[11px] text-slate mt-1">{m.progress.toFixed(m.id === "major" ? 2 : 0)} / {m.target}</div></div>)}</div></section>
      <section><h2 className="font-display text-xl mb-3">📖 Journal de l'Académie</h2><div className="border border-line bg-white/70 divide-y divide-line">{d.journal.slice(0,6).map(j => <div key={j.id} className="p-4"><div className="text-[10px] uppercase tracking-wide text-slate">{j.annee}</div><div className="font-medium mt-1">{j.title}</div><p className="text-sm text-slate mt-1 leading-relaxed">{j.body}</p></div>)}</div></section></div>
  </div>;
}
