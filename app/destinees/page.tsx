"use client";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import { getDeepState, scoreDestinee } from "@/lib/engines/deepSimulation";
const money=(n:number)=>`${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const labels:Record<string,string>={leader:"Leader",expert:"Expert",entrepreneur:"Entrepreneur",chercheur:"Chercheur",humaniste:"Humaniste",explorateur:"Explorateur",artisan:"Bâtisseur"};
export default function DestineesPage(){
 const s=useAcademyStore(x=>x.session); if(!s)return <div className="p-8">Aucune session. <Link href="/">Créer une génération →</Link></div>;
 const deep=getDeepState(s); const rows=Object.values(s.eleves).map(e=>({e,d:deep.destinies[e.matricule]})).filter(x=>x.d).sort((a,b)=>scoreDestinee(s,b.e)-scoreDestinee(s,a.e)).slice(0,40);
 const moments=rows.flatMap(x=>x.d.moments.map(m=>({...m,e:x.e}))).sort((a,b)=>b.annee.localeCompare(a.annee)).slice(0,12);
 return <div className="p-5 md:p-10 max-w-7xl"><PageHeader eyebrow="Simulation profonde" title="Destinées & légendes" description="Les 600 parcours évoluent avec leurs talents, leurs relations, le monde et les décisions prises au fil des années."/>
  <div className="grid md:grid-cols-5 gap-3 mb-8">{[["Années",s.historiqueAnnees.length],["Destinées",Object.keys(deep.destinies).length],["Secrets",deep.unlockedSecrets.length],["Événements monde",deep.globalEvents.length],["Protégés",s.directeur?.protectedStudents.length??0]].map(([a,b])=><div className="border border-line bg-white/70 p-4" key={String(a)}><div className="text-[10px] uppercase tracking-wide text-slate">{a}</div><div className="font-display text-xl mt-2">{b}</div></div>)}</div>
  <div className="grid lg:grid-cols-[1.25fr_.75fr] gap-8">
   <section><div className="flex justify-between items-end mb-3"><div><h2 className="font-display text-xl">🏛️ Légendes en devenir</h2><p className="text-xs text-slate mt-1">Score = réputation + influence + satisfaction − risque.</p></div><Link href="/strategie" className="text-xs border-b border-gold">Jouer une décision →</Link></div>
    <div className="border border-line bg-white/70 divide-y divide-line">{rows.map((x,i)=><div key={x.e.matricule} className="p-4 grid md:grid-cols-[42px_1.4fr_.7fr_.9fr] gap-3 items-center"><div className="font-display text-xl">{i<3?["🥇","🥈","🥉"][i]:i+1}</div><div><div className="font-medium">{x.e.prenom} {x.e.nom}</div><div className="text-xs text-slate">{x.e.matricule} · {labels[x.d.archetype]}</div></div><div className="text-xs"><span className="font-medium">Réputation {x.d.reputation}</span><div className="text-slate mt-1">Influence {x.d.influence} · Réseau {x.d.reseau}</div></div><div className="text-xs"><span className="font-medium">{scoreDestinee(s,x.e).toFixed(0)} pts</span><div className="text-slate mt-1">Satisfaction {x.d.satisfaction} · Risque {x.d.risque}</div></div></div>)}</div>
   </section>
   <aside><h2 className="font-display text-xl mb-3">📰 Chronique émergente</h2><div className="border border-line bg-white/70 divide-y divide-line">{moments.map((m,i)=><div className="p-4" key={`${m.e.matricule}-${m.annee}-${m.titre}-${i}`}><div className="text-[10px] uppercase tracking-wide text-slate">{m.annee} · {m.e.prenom} {m.e.nom}</div><div className="font-medium mt-1">{m.titre}</div><div className="text-xs text-slate mt-1 leading-relaxed">{m.texte}</div></div>)}</div>
    <h2 className="font-display text-xl mt-8 mb-3">🔓 Secrets découverts</h2><div className="flex flex-wrap gap-2">{deep.unlockedSecrets.length?deep.unlockedSecrets.map(x=><span key={x} className="border border-gold bg-gold-soft/20 px-3 py-2 text-xs">{x.replaceAll("-"," ")}</span>):<span className="text-sm text-slate">Aucun secret révélé. Continuez la simulation.</span>}</div>
    <h2 className="font-display text-xl mt-8 mb-3">🌍 Histoire du monde</h2><div className="space-y-2">{deep.globalEvents.slice(0,6).map(x=><div key={x.id} className="border border-line bg-white/70 p-3"><div className="text-[10px] text-slate">{x.annee}</div><div className="text-sm font-medium mt-1">{x.titre}</div><div className="text-xs text-slate mt-1">{x.texte}</div></div>)}</div>
   </aside>
  </div>
 </div>
}
