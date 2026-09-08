"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import { hallOfFame } from "@/lib/engines/ranking";
import { Domaine, LIBELLE_DOMAINE, scoreDuDomaine } from "@/lib/engines/domaines";
import { calculerBadges } from "@/lib/engines/badges";

type Onglet = "generation" | Domaine;

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "generation", label: "🏆 Génération" },
  { id: "scientifique", label: "🧮 Scientifiques" },
  { id: "litteraire", label: "🖋️ Littéraires" },
  { id: "technologique", label: "💡 Technologiques" },
  { id: "naturaliste", label: "🔬 Naturalistes" },
];

export default function HallOfFamePage() {
  const session = useAcademyStore((s) => s.session);
  const [onglet, setOnglet] = useState<Onglet>("generation");

  const classementDomaine = useMemo(() => {
    if (!session || onglet === "generation") return [];
    const eleves = Object.values(session.eleves).filter(
      (e) => e.statut === "actif" || e.statut === "redoublant"
    );
    return eleves
      .map((e) => ({ eleve: e, score: scoreDuDomaine(e, onglet) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [session, onglet]);

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
      <PageHeader
        eyebrow="🏆"
        title="Hall of Fame"
        description="Le meilleur de la génération, dans l'ensemble et dans chaque grand domaine de talent."
      />

      {bilan && onglet === "generation" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Diplômés" value={bilan.diplomes} accent="forest" />
            <StatCard label="En poursuite post-bac" value={bilan.enPostBac} accent="gold" />
            <StatCard label="Admission d'excellence" value={bilan.admisPolytechnique} accent="gold" />
            <StatCard label="Recalés" value={bilan.recales} accent="burgundy" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="École d'ingénieurs" value={bilan.ecolesIngenieurs} accent="gold" />
            <StatCard label="Prépa scientifique" value={bilan.prepaScientifique} accent="forest" />
            <StatCard label="Prépa littéraire" value={bilan.prepaLitteraire} accent="burgundy" />
            <StatCard label="DUT / BTS" value={bilan.dut} />
          </div>
        </>
      )}

      <div className="flex border border-line bg-white/60 mb-6 w-fit flex-wrap">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`px-3.5 py-2 text-sm ${onglet === o.id ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "generation" ? (
        <div className="border border-line bg-white/60 divide-y divide-line">
          {top.map((e) => (
            <Link
              key={e.matricule}
              href={`/eleves/${e.matricule}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-paper-dim transition-colors"
            >
              <div
                className={`font-display text-xl w-8 text-center shrink-0 ${
                  e.rang === 1 ? "text-gold" : e.rang <= 3 ? "text-ink" : "text-slate"
                }`}
              >
                {e.rang}
              </div>
              <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {e.nom} {e.prenom}
                </div>
                <div className="text-xs text-slate">
                  {e.matricule} · {e.classeNom}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-lg text-ink">{e.moyenneCumulee.toFixed(2)}</div>
                <div className="text-[11px] text-slate">moyenne cumulée</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-line bg-white/60 divide-y divide-line">
          {classementDomaine.length === 0 ? (
            <p className="text-sm text-slate p-4">Aucune donnée pour l&apos;instant.</p>
          ) : (
            classementDomaine.map(({ eleve: e, score }, i) => {
              const badges = calculerBadges(e);
              return (
                <Link
                  key={e.matricule}
                  href={`/eleves/${e.matricule}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-paper-dim transition-colors"
                >
                  <div
                    className={`font-display text-xl w-8 text-center shrink-0 ${
                      i === 0 ? "text-gold" : i < 3 ? "text-ink" : "text-slate"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {e.nom} {e.prenom}
                    </div>
                    <div className="text-xs text-slate truncate">
                      {badges.length > 0
                        ? badges.slice(0, 2).map((b) => `${b.icone} ${b.titre}`).join(" · ")
                        : e.matricule}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-lg text-ink">{score.toFixed(1)}</div>
                    <div className="text-[11px] text-slate">score {LIBELLE_DOMAINE[onglet as Domaine].toLowerCase()}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
