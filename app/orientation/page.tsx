"use client";

import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { scoreOrientation, orienterPostBac } from "@/lib/engines/orientation";
import { mulberry32 } from "@/lib/utils/random";
import { NOM_NIVEAU } from "@/lib/data/subjects";

export default function OrientationPage() {
  const session = useAcademyStore((s) => s.session);

  if (!session) {
    return (
      <div className="p-5 md:p-10">
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

  const eleves = Object.values(session.eleves);

  const repartition = eleves.reduce<Record<string, number>>((acc, e) => {
    acc[e.niveau] = (acc[e.niveau] ?? 0) + 1;
    return acc;
  }, {});

  const enTerminale = eleves.filter(
    (e) => e.niveau === "TermC" || e.niveau === "TermD" || e.niveau === "TermA"
  );

  const recentesOrientations = eleves
    .flatMap((e) => e.historiqueOrientation.map((o) => ({ ...o, eleve: e })))
    .sort((a, b) => (a.annee < b.annee ? 1 : -1))
    .slice(0, 20);

  return (
    <div className="p-5 md:p-10 max-w-6xl">
      <PageHeader
        eyebrow="Moteur d'orientation"
        title="Orientation"
        description="L'orientation combine compétences par matière, raisonnement, progression et potentiel — jamais la seule moyenne générale."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="3e" value={repartition["3e"] ?? 0} />
        <StatCard label="Seconde C" value={repartition["2ndeC"] ?? 0} accent="forest" />
        <StatCard label="Seconde A" value={repartition["2ndeA"] ?? 0} accent="burgundy" />
        <StatCard
          label="Recalés"
          value={eleves.filter((e) => e.statut === "recale").length}
          accent="burgundy"
        />
      </div>

      {enTerminale.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-lg text-ink mb-3">
            Recommandations universitaires — Terminale
          </h2>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {enTerminale.slice(0, 15).map((e) => {
              const rngApercu = mulberry32(e.matricule.split("").reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
              const { niveau: destination, filieresConseillees, excellence } = orienterPostBac(e, rngApercu);
              const score = scoreOrientation(e);
              return (
                <div key={e.matricule} className="px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <Link href={`/eleves/${e.matricule}`} className="text-sm font-medium text-ink hover:text-gold">
                      {e.matricule} — {e.nom} {e.prenom}
                    </Link>
                    <div className="text-xs text-slate mt-1">
                      {NOM_NIVEAU[destination]} · {filieresConseillees.slice(0, 3).map((f) => f.nom).join(" · ")}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate">
                    <div>Sc. {score.scientifique} / Litt. {score.litteraire}</div>
                    {excellence && (
                      <div className="text-forest font-medium mt-0.5">Admission d&apos;excellence</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg text-ink mb-3">Dernières décisions d&apos;orientation</h2>
        <div className="border border-line bg-white/60 divide-y divide-line">
          {recentesOrientations.length === 0 ? (
            <p className="text-sm text-slate p-4">
              Aucune orientation encore calculée — avancez la timeline jusqu&apos;à l&apos;étape
              &laquo; Orientation &raquo;.
            </p>
          ) : (
            recentesOrientations.map((o, i) => (
              <div key={i} className="px-4 py-3">
                <Link
                  href={`/eleves/${o.eleve.matricule}`}
                  className="text-sm text-ink hover:text-gold"
                >
                  {o.eleve.matricule} — {o.eleve.nom} {o.eleve.prenom}
                </Link>
                <div className="text-xs text-slate mt-0.5">
                  {NOM_NIVEAU[o.niveauOrigine] ?? o.niveauOrigine} →{" "}
                  {NOM_NIVEAU[o.niveauDestination as never] ?? o.niveauDestination} · {o.motif}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
