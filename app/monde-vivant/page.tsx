"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import { getDeepState } from "@/lib/engines/deepSimulation";

const fcfa = (n:number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

export default function MondeVivantPage(){
  const session=useAcademyStore(s=>s.session);
  const deep=useMemo(()=>session?getDeepState(session):null,[session]);
  if(!session||!deep) return <div className="p-6">Aucune session active. <Link href="/" className="underline">Créer une session</Link>.</div>;
  const alumni=Object.values(deep.alumni).sort((a,b)=>b.influence-a.influence);
  const entreprises=Object.values(deep.enterprises).sort((a,b)=>b.valeur-a.valeur);
  const dynasties=Object.values(deep.dynasties).sort((a,b)=>b.influence-a.influence);
  const events=deep.globalEvents.slice(0,8);
  const history=deep.worldHistory.slice(-12);
  const fortunes=alumni.slice().sort((a,b)=>b.patrimoineEstime-a.patrimoineEstime).slice(0,8);

  return <div className="p-5 md:p-10 max-w-6xl">
    <PageHeader eyebrow="🌍 MONDE VIVANT" title="Le monde continue sans vous" description="L'économie, les entreprises, les anciens élèves, les fortunes et les dynasties évoluent avec le temps. Chaque génération laisse une trace." />

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Score de legacy" value={`${deep.legacyScore}/100`} accent="gold" />
      <StatCard label="Alumni archivés" value={alumni.length} accent="forest" />
      <StatCard label="Entreprises créées" value={entreprises.length} accent="gold" />
      <StatCard label="Dynasties" value={dynasties.length} accent="burgundy" />
    </div>

    <section className="mb-8">
      <div className="flex items-end justify-between mb-3"><div><div className="text-[10px] uppercase tracking-[.18em] text-gold">Macro-économie</div><h2 className="font-display text-2xl">Chronologie du monde</h2></div><span className="text-xs text-slate">{history.length} dernières années</span></div>
      <div className="border border-line bg-white/60 divide-y divide-line">
        {history.slice().reverse().map((h)=><div key={h.annee} className="grid grid-cols-[90px_1fr_auto] gap-4 px-4 py-3 items-center"><div className="font-medium">{h.annee}</div><div><div className="text-sm">{h.headline}</div><div className="text-[11px] text-slate">Secteur fort : {h.secteur}</div></div><div className="text-right text-xs"><div>Économie {Math.round(h.economie)}</div><div>Tech {Math.round(h.technologie)} · Emploi {Math.round(h.emploi)}</div></div></div>)}
      </div>
    </section>

    <div className="grid md:grid-cols-2 gap-8">
      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Patrimoine</div><h2 className="font-display text-2xl mb-3">Les grandes fortunes</h2><div className="border border-line bg-white/60 divide-y divide-line">{fortunes.length===0?<div className="p-5 text-sm text-slate">Les premières grandes fortunes apparaîtront au fil des carrières.</div>:fortunes.map((a,i)=>{const e=session.eleves[a.matricule];return <Link key={a.matricule} href={`/eleves/${a.matricule}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper-dim"><div className="font-display text-lg w-5">{i+1}</div><Avatar matricule={a.matricule} nom={e?.nom??a.nomComplet.split(" ").slice(-1).join(" ")} prenom={e?.prenom??a.nomComplet.split(" ").slice(0,-1).join(" ")} size={30}/><div className="flex-1"><div className="text-sm font-medium">{a.nomComplet}</div><div className="text-[11px] text-slate">{a.distinction} · {a.secteur}</div></div><div className="text-xs font-medium">{fcfa(a.patrimoineEstime)}</div></Link>})}</div></section>

      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Écosystème</div><h2 className="font-display text-2xl mb-3">Entreprises issues de la génération</h2><div className="border border-line bg-white/60 divide-y divide-line">{entreprises.length===0?<div className="p-5 text-sm text-slate">Aucune entreprise fondée pour le moment.</div>:entreprises.slice(0,8).map(ent=><div key={ent.id} className="px-4 py-3"><div className="flex justify-between gap-3"><div className="text-sm font-medium">{ent.nom}</div><span className="text-[10px] uppercase text-gold">{ent.statut}</span></div><div className="text-[11px] text-slate mt-1">{ent.secteur} · {ent.emplois} emplois · valeur {fcfa(ent.valeur)}</div><div className="text-[11px] mt-1">Croissance annuelle : {ent.croissance > 0 ? "+" : ""}{ent.croissance}%</div></div>)}</div></section>
    </div>

    <div className="grid md:grid-cols-2 gap-8 mt-8">
      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Transmission</div><h2 className="font-display text-2xl mb-3">Dynasties & héritage</h2><div className="border border-line bg-white/60 divide-y divide-line">{dynasties.length===0?<div className="p-5 text-sm text-slate">Les familles influentes se construisent lorsque les trajectoires personnelles et patrimoniales convergent.</div>:dynasties.map(d=><div key={d.id} className="px-4 py-3"><div className="font-medium text-sm">{d.nom}</div><div className="text-xs text-slate mt-1">{d.membres.length} membre(s) · génération {d.generation} · influence {d.influence}/100</div><div className="text-xs mt-1">Patrimoine estimé : {fcfa(d.patrimoine)}</div><div className="text-[11px] italic text-slate mt-1">« {d.devise} »</div></div>)}</div></section>
      <section><div className="text-[10px] uppercase tracking-[.18em] text-gold mb-1">Chronique</div><h2 className="font-display text-2xl mb-3">Moments historiques</h2><div className="border border-line bg-white/60 divide-y divide-line">{events.map(ev=><div key={ev.id} className="px-4 py-3"><div className="text-[10px] text-gold uppercase">{ev.annee}</div><div className="font-medium text-sm mt-0.5">{ev.titre}</div><div className="text-xs text-slate mt-1">{ev.texte}</div></div>)}</div></section>
    </div>
  </div>;
}
