"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import { getLegacyState } from "@/lib/engines/legacy";

const fcfa=(n:number)=>`${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function HeritagePage(){
  const session=useAcademyStore(s=>s.session);
  const preparer=useAcademyStore(s=>s.preparerGenerationSuivante);
  const simuler=useAcademyStore(s=>s.simulerLegacy);
  const [message,setMessage]=useState("");
  const legacy=useMemo(()=>session?getLegacyState(session):null,[session]);
  if(!session||!legacy) return <div className="p-6">Aucune session active. <Link href="/" className="underline">Créer une session</Link>.</div>;
  const generations=Object.values(legacy.generations).sort((a,b)=>b.generation-a.generation);
  const descendants=Object.values(legacy.descendants).sort((a,b)=>b.reseauFamilial-b.reseauFamilial);
  const partners=Object.values(legacy.partners).sort((a,b)=>b.prestige-a.prestige);
  const milestones=legacy.worldMilestones.slice(0,10);
  const action=(fn:()=>number|string|void, ok:string)=>{ const r=fn(); setMessage(typeof r==="number"?`${r} descendant(s) préparé(s) pour la génération suivante.`:ok); };

  return <div className="p-5 md:p-10 max-w-6xl">
    <PageHeader eyebrow="🧬 HÉRITAGE & GÉNÉRATIONS" title="Ce que la génération laisse derrière elle" description="Les anciens ne disparaissent plus de la simulation : leurs réseaux, entreprises, patrimoines, partenaires et descendants façonnent les générations suivantes." />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Score transmission" value={`${legacy.transmissionScore}/100`} accent="gold" />
      <StatCard label="Héritage estimé" value={fcfa(legacy.heritageTotal)} accent="forest" />
      <StatCard label="Descendants" value={Object.keys(legacy.descendants).length} accent="burgundy" />
      <StatCard label="Partenariats" value={Object.keys(legacy.partners).length} accent="gold" />
    </div>
    <div className="flex flex-wrap gap-2 mb-8">
      <button onClick={()=>action(simuler,"Simulation de transmission mise à jour.")} className="bg-ink text-paper px-4 py-2 text-sm">Faire vivre l'héritage →</button>
      <button onClick={()=>action(preparer,"Nouvelle génération préparée.")} className="border border-ink px-4 py-2 text-sm">Lancer la génération suivante</button>
      {message && <span className="text-sm text-slate self-center">{message}</span>}
    </div>
    <section className="mb-8"><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Lignées</div><h2 className="font-display text-2xl mb-3">Les générations de l'Académie</h2><div className="border border-line bg-white/60 divide-y divide-line">{generations.map(g=><div key={g.id} className="grid md:grid-cols-[1fr_auto_auto] gap-4 px-4 py-4"><div><div className="font-medium">{g.nom}</div><div className="text-xs text-slate mt-1">Génération {g.generation} · {g.total} membre(s) · commencée en {g.anneeDebut}</div></div><div className="text-sm">Entrée {g.moyenneEntree}/100</div><div className="text-sm">Prestige {g.prestige}/100</div></div>)}</div></section>
    <div className="grid md:grid-cols-2 gap-8">
      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Descendance</div><h2 className="font-display text-2xl mb-3">Les héritiers potentiels</h2><div className="border border-line bg-white/60 divide-y divide-line">{descendants.length===0?<div className="p-5 text-sm text-slate">Les premiers enfants apparaîtront lorsque des trajectoires auront construit des familles.</div>:descendants.slice(0,12).map(d=><div key={d.id} className="px-4 py-3"><div className="flex justify-between"><div className="text-sm font-medium">{d.nomComplet}</div><span className="text-[10px] uppercase text-gold">Gén. {d.generation}</span></div><div className="text-xs text-slate mt-1">Potentiel {d.potentiel} · réseau familial {d.reseauFamilial} · patrimoine transmis {fcfa(d.patrimoineHerite)}</div><div className="text-[11px] mt-1">Curiosité {d.curiosite} · discipline {d.discipline} · créativité {d.creativite} · ambition {d.ambition}</div></div>)}</div></section>
      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Écosystème</div><h2 className="font-display text-2xl mb-3">Universités & partenaires</h2><div className="border border-line bg-white/60 divide-y divide-line">{partners.map(p=><div key={p.id} className="px-4 py-3"><div className="flex justify-between"><div className="text-sm font-medium">{p.nom}</div><span className="text-xs">Prestige {p.prestige}</span></div><div className="text-[11px] text-slate mt-1">{p.recrutements} recrutements · {p.bourses} bourses · {p.alumni} alumni associés</div><div className="text-[11px] mt-1">{p.derniereAction}</div></div>)}</div></section>
    </div>
    <section className="mt-8"><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Histoire</div><h2 className="font-display text-2xl mb-3">Grandes transmissions</h2><div className="border border-line bg-white/60 divide-y divide-line">{milestones.length===0?<div className="p-5 text-sm text-slate">Les grands moments apparaîtront au fil des années.</div>:milestones.map(m=><div key={m.annee+m.titre} className="px-4 py-3"><div className="text-[10px] uppercase text-gold">{m.annee}</div><div className="font-medium text-sm">{m.titre}</div><div className="text-xs text-slate mt-1">{m.texte}</div></div>)}</div></section>
  </div>;
}
