"use client";

import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import TimelineControl from "@/components/TimelineControl";
import EventFeed from "@/components/EventFeed";
import { NOM_NIVEAU } from "@/lib/data/subjects";

export default function DashboardPage() {
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

  const eleves = Object.values(session.eleves);
  const actifs = eleves.filter((e) => e.statut === "actif" || e.statut === "redoublant");
  const moyennes = actifs
    .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
    .filter((m): m is number => m !== undefined);
  const moyenneGenerale = moyennes.length
    ? Math.round((moyennes.reduce((a, b) => a + b, 0) / moyennes.length) * 100) / 100
    : 0;
  const tauxReussite = moyennes.length
    ? Math.round((moyennes.filter((m) => m >= 10).length / moyennes.length) * 100)
    : 0;

  const meilleurEleve = [...actifs].sort((a, b) => {
    const ma = a.moyennes[a.moyennes.length - 1]?.moyenneGenerale ?? 0;
    const mb = b.moyennes[b.moyennes.length - 1]?.moyenneGenerale ?? 0;
    return mb - ma;
  })[0];

  const classesParMoyenne = session.classes
    .map((c) => {
      const eleveClasse = c.matricules
        .map((m) => session.eleves[m])
        .filter(Boolean);
      const moys = eleveClasse
        .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
        .filter((m): m is number => m !== undefined);
      const moyenne = moys.length ? moys.reduce((a, b) => a + b, 0) / moys.length : 0;
      return { classe: c, moyenne };
    })
    .sort((a, b) => b.moyenne - a.moyenne);
  const meilleureClasse = classesParMoyenne[0];

  const recales = eleves.filter((e) => e.statut === "recale").length;
  const universite = eleves.filter((e) => e.statut === "universite").length;

  return (
    <div className="p-10 max-w-6xl">
      <PageHeader
        eyebrow={session.nomSession}
        title="Tableau de bord"
        description={`Suivi de la promotion — ${session.anneeCourante.libelle}`}
      />

      <div className="mb-6">
        <TimelineControl />
      </div>

      {(session.favoris ?? []).length === 0 && (
        <div className="border border-gold bg-gold-soft/30 px-5 py-3 mb-8 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-ink">
            ★ Envie de suivre l&apos;évolution de quelques élèves en particulier ? Marquez-les
            comme favoris depuis leur fiche ou n&apos;importe quel tableau.
          </p>
          <Link href="/eleves" className="text-sm text-ink border-b border-gold hover:text-ink-soft shrink-0">
            Choisir mes favoris →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Élèves actifs" value={actifs.length} sub={`sur ${eleves.length} au départ`} />
        <StatCard label="Classes" value={session.classes.length} />
        <StatCard label="Moyenne générale" value={moyenneGenerale.toFixed(2)} accent="gold" />
        <StatCard label="Taux de réussite" value={`${tauxReussite}%`} accent="forest" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Meilleur élève"
          value={meilleurEleve ? meilleurEleve.matricule : "—"}
          sub={meilleurEleve ? `${meilleurEleve.nom} ${meilleurEleve.prenom}` : ""}
        />
        <StatCard
          label="Meilleure classe"
          value={meilleureClasse ? meilleureClasse.classe.nom : "—"}
          sub={meilleureClasse ? `Moy. ${meilleureClasse.moyenne.toFixed(2)}` : ""}
        />
        <StatCard label="Recalés" value={recales} accent="burgundy" />
        <StatCard label="Université / Écoles" value={universite} accent="forest" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Répartition par niveau</h2>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {Object.entries(
              actifs.reduce<Record<string, number>>((acc, e) => {
                acc[e.niveau] = (acc[e.niveau] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([niveau, count]) => (
              <div key={niveau} className="px-4 py-2.5 flex justify-between text-sm">
                <span className="text-slate">{NOM_NIVEAU[niveau as keyof typeof NOM_NIVEAU] ?? niveau}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-3">📣 Faits marquants</h2>
          <div className="border border-line bg-white/60 px-4 py-2">
            <EventFeed eleves={actifs} limite={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
