"use client";

import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { hallOfFame } from "@/lib/engines/ranking";

export default function HallOfFamePage() {
  const session = useAcademyStore((s) => s.session);

  if (!session) {
    return (
      <div className="p-10">
        <p className="text-slate text-sm">
          Aucune session active.{" "}
          <Link href="/" className="text-ink border-b border-gold">
            Créer une nouvelle session
          </Link>
          .
        </p>
      </div>
    );
  }

  const top = hallOfFame(session, 20);
  const bilan = session.bilan;

  return (
    <div className="p-10 max-w-4xl">
      <PageHeader eyebrow="🏆" title="Hall of Fame" description="Meilleurs élèves depuis la 3e, selon la moyenne cumulée sur tous les trimestres." />

      {bilan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label="Diplômés" value={bilan.diplomes} accent="forest" />
          <StatCard label="Admission d'excellence" value={bilan.admisPolytechnique} accent="gold" />
          <StatCard label="Recalés" value={bilan.recales} accent="burgundy" />
          <StatCard label="Redoublements" value={bilan.redoublements} />
        </div>
      )}

      {bilan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="École d'ingénieurs" value={bilan.ecolesIngenieurs} accent="gold" />
          <StatCard label="Prépa scientifique" value={bilan.prepaScientifique} accent="forest" />
          <StatCard label="Prépa littéraire" value={bilan.prepaLitteraire} accent="burgundy" />
          <StatCard label="DUT / BTS" value={bilan.dut} />
          <StatCard label="Université" value={bilan.universitaires} />
        </div>
      )}

      <div className="border border-line bg-white/60 divide-y divide-line">
        {top.map((e) => (
          <Link
            key={e.matricule}
            href={`/eleves/${e.matricule}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-paper-dim transition-colors"
          >
            <div
              className={`font-display text-xl w-8 text-center ${
                e.rang === 1 ? "text-gold" : e.rang <= 3 ? "text-ink" : "text-slate"
              }`}
            >
              {e.rang}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink">
                {e.matricule} — {e.nom} {e.prenom}
              </div>
              <div className="text-xs text-slate">{e.classeNom}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg text-ink">{e.moyenneCumulee.toFixed(2)}</div>
              <div className="text-[11px] text-slate">moyenne cumulée</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
