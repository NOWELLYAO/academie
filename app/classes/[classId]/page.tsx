"use client";

import { use } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StudentTable from "@/components/StudentTable";
import EventFeed from "@/components/EventFeed";
import { NOM_NIVEAU } from "@/lib/data/subjects";

export default function ClasseDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = use(params);
  const session = useAcademyStore((s) => s.session);

  if (!session) return null;
  const classe = session.classes.find((c) => c.id === classId);
  if (!classe) {
    return (
      <div className="p-10">
        <p className="text-slate text-sm">Classe introuvable.</p>
      </div>
    );
  }

  const eleves = classe.matricules.map((m) => session.eleves[m]).filter(Boolean);
  const moys = eleves
    .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
    .filter((m): m is number => m !== undefined);
  const moyenne = moys.length ? moys.reduce((a, b) => a + b, 0) / moys.length : 0;
  const meilleure = moys.length ? Math.max(...moys) : 0;
  const plusFaible = moys.length ? Math.min(...moys) : 0;
  const tauxReussite = moys.length
    ? Math.round((moys.filter((m) => m >= 10).length / moys.length) * 100)
    : 0;

  return (
    <div className="p-10 max-w-6xl">
      <Link href="/classes" className="text-xs text-slate hover:text-ink mb-4 inline-block">
        ← Toutes les classes
      </Link>
      <PageHeader
        eyebrow={NOM_NIVEAU[classe.niveau]}
        title={classe.nom}
        description={`${eleves.length} élèves — pour générer les notes de ce niveau, direction "Notes par niveau" dans le menu.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Moyenne de classe" value={moyenne.toFixed(2)} accent="gold" />
        <StatCard label="Meilleure moyenne" value={meilleure.toFixed(2)} accent="forest" />
        <StatCard label="Plus faible moyenne" value={plusFaible.toFixed(2)} accent="burgundy" />
        <StatCard label="Taux de réussite" value={`${tauxReussite}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg text-ink mb-3">Feuille de notes</h2>
          <StudentTable eleves={eleves} />
        </div>
        <div>
          <h2 className="font-display text-lg text-ink mb-3">📣 Faits marquants</h2>
          <div className="border border-line bg-white/60 px-4 py-2">
            <EventFeed eleves={eleves} limite={10} />
          </div>
        </div>
      </div>
    </div>
  );
}
