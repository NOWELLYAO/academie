"use client";

import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import TimelineControl from "@/components/TimelineControl";
import EventFeed from "@/components/EventFeed";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { ORDRE_NIVEAUX } from "@/lib/models/types";

export default function DashboardPage() {
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
  const enPostBac = eleves.filter((e) => e.statut === "universite").length;
  const diplomes = eleves.filter((e) => e.statut === "diplome" || e.statut === "retraite").length;
  const retraites = eleves.filter((e) => e.statut === "retraite").length;

  return (
    <div className="p-5 md:p-10 max-w-6xl">
      <PageHeader
        eyebrow={session.nomSession}
        title="Tableau de bord"
        description={`Suivi de la promotion — ${session.anneeCourante.libelle}`}
      />

      <div className="mb-6">
        <TimelineControl />
      </div>

      {(session.favoris ?? []).length === 0 && (
        <div className="border border-gold bg-gold-soft/30 px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-ink">
            ★ Envie de suivre l&apos;évolution de quelques élèves en particulier ? Marquez-les
            comme favoris depuis leur fiche ou n&apos;importe quel tableau.
          </p>
          <Link href="/eleves" className="text-sm text-ink border-b border-gold hover:text-ink-soft shrink-0">
            Choisir mes favoris →
          </Link>
        </div>
      )}

      <details className="border border-line bg-white/60 px-5 py-3 mb-8 text-sm">
        <summary className="cursor-pointer font-medium text-ink">
          ℹ️ Comment fonctionne la progression des élèves ?
        </summary>
        <div className="mt-3 space-y-2 text-slate leading-relaxed">
          <p>
            <strong className="text-ink">Avant le Bac :</strong> 3e (examen BEPC) → Seconde → Première →
            Terminale (examen Bac). Seules la 3e et la Terminale ont un examen national ; entre les deux,
            le passage se fait sur la seule moyenne annuelle.
          </p>
          <p>
            <strong className="text-ink">Après le Bac</strong>, chaque cursus a une durée fixe, passe
            chaque année sa propre session d&apos;examens (coefficients propres à la filière), et se
            termine toujours par un diplôme — la simulation continue de suivre l&apos;élève chaque année
            jusqu&apos;au bout, ce n&apos;est jamais une impasse :
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>DUT / BTS — 2 ans</li>
            <li>Université — 3 ans</li>
            <li>Classe préparatoire scientifique — 2 ans, puis 3 ans d&apos;école d&apos;ingénieurs (5 ans au total)</li>
            <li>Classe préparatoire littéraire — 2 ans, puis université</li>
            <li>École d&apos;ingénieurs en admission directe (excellence au Bac) — 5 ans</li>
          </ul>
          <p>
            <strong className="text-ink">Redoublement :</strong> un seul redoublement est autorisé sur
            tout le parcours d&apos;un élève, à n&apos;importe quel niveau. En cas de nouvel échec après ce
            redoublement, l&apos;élève est recalé et sort définitivement du parcours scolaire classique.
          </p>
          <p>
            Pour voir cette progression année après année,{" "}
            <Link href="/evolution" className="text-ink border-b border-gold">
              consultez la page Évolution
            </Link>
            , ou ouvrez la fiche d&apos;un élève pour son parcours complet et détaillé.
          </p>
        </div>
      </details>

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
        <StatCard label="En poursuite post-bac" value={enPostBac} accent="forest" sub="Prépa, DUT, université, école" />
        <StatCard label="Diplômés" value={diplomes} accent="gold" sub={`dont ${retraites} retraité(e)s`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Répartition par niveau</h2>
          <p className="text-xs text-slate mb-2">
            Du collège jusqu&apos;au post-bac — inclut les élèves déjà orientés vers une prépa, un
            DUT, l&apos;université ou une école d&apos;ingénieurs.
          </p>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {(() => {
              const repartition = eleves
                .filter((e) => e.statut !== "recale")
                .reduce<Record<string, number>>((acc, e) => {
                  acc[e.niveau] = (acc[e.niveau] ?? 0) + 1;
                  return acc;
                }, {});
              return ORDRE_NIVEAUX.filter((n) => repartition[n] > 0).map((niveau) => (
                <div key={niveau} className="px-4 py-2.5 flex justify-between text-sm">
                  <span className="text-slate">{NOM_NIVEAU[niveau]}</span>
                  <span className="font-medium tabular-nums">{repartition[niveau]}</span>
                </div>
              ));
            })()}
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
