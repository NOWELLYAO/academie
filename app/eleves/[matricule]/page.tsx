"use client";

import { use } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import CompetenceBars from "@/components/CompetenceBars";
import ParcoursCarte from "@/components/ParcoursCarte";
import EvolutionCharts from "@/components/EvolutionCharts";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { qualifierPotentiel, qualifierVolatilite } from "@/lib/engines/potential";
import { genererAppreciation } from "@/lib/engines/narrative";
import { calculerBadges } from "@/lib/engines/badges";
import { formaterFCFA } from "@/lib/engines/finances";
import { exporterBulletinIndividuel } from "@/lib/export/pdf";
import FavoriteStar from "@/components/FavoriteStar";
import Avatar from "@/components/Avatar";
import FicheNotesComplete from "@/components/FicheNotesComplete";

export default function ElevePage({
  params,
}: {
  params: Promise<{ matricule: string }>;
}) {
  const { matricule } = use(params);
  const session = useAcademyStore((s) => s.session);

  if (!session) return null;
  const eleve = session.eleves[matricule];

  if (!eleve) {
    return (
      <div className="p-5 md:p-10">
        <p className="text-slate text-sm">Élève introuvable.</p>
      </div>
    );
  }

  const derniere = eleve.moyennes[eleve.moyennes.length - 1];
  const nomClasse = session.classes.find((c) => c.id === eleve.classeId)?.nom ?? eleve.classeId;
  const appreciation = genererAppreciation(eleve);
  const badges = calculerBadges(eleve);

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <Link href="/eleves" className="text-xs text-slate hover:text-ink mb-4 inline-block">
        ← Recherche d&apos;élèves
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Avatar matricule={eleve.matricule} nom={eleve.nom} prenom={eleve.prenom} size={64} />
          <PageHeader
            eyebrow={`${eleve.matricule} · ${nomClasse}`}
            title={
              <span className="inline-flex items-center gap-2">
                {eleve.nom} {eleve.prenom}
                <FavoriteStar matricule={eleve.matricule} size="text-2xl" />
              </span>
            }
            description={`${eleve.statut === "diplome" ? "🎓 Diplômé" : eleve.anneePostBac ? `${NOM_NIVEAU[eleve.niveau]} (${eleve.anneePostBac}e année)` : NOM_NIVEAU[eleve.niveau]} · Origine ${eleve.pays}`}
          />
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide text-slate">Moyenne générale</div>
          <div className="font-display text-4xl text-ink">
            {derniere ? derniere.moyenneGenerale.toFixed(2) : "—"}
          </div>
          {derniere && (
            <div className="text-xs text-slate mt-1">
              Rang {derniere.rangClasse} classe · {derniere.rangGeneration} génération
            </div>
          )}
          <div className="mt-2 text-sm text-ink font-medium">
            💰 {formaterFCFA(eleve.solde ?? 0)}
            {eleve.boursier && <span className="ml-1.5 text-xs text-gold">🎓 Boursier</span>}
          </div>
          <button
            onClick={() => exporterBulletinIndividuel(eleve, nomClasse, session.nomSession, appreciation)}
            className="mt-3 text-xs border border-ink text-ink px-3 py-1.5 hover:bg-paper-dim transition-colors"
          >
            Télécharger le bulletin PDF
          </button>
        </div>
      </div>

      <div className="border border-line bg-white/60 px-6 py-6 mb-8">
        <ParcoursCarte eleve={eleve} />
      </div>

      <div className="flex gap-2 mb-6">
        <span className="text-xs border border-gold text-ink px-2.5 py-1 bg-gold-soft/40">
          {qualifierPotentiel(eleve)}
        </span>
        <span className="text-xs border border-line text-slate px-2.5 py-1">
          {qualifierVolatilite(eleve)}
        </span>
        {eleve.admissiblePolytechnique && (
          <span className="text-xs border border-forest text-forest px-2.5 py-1 bg-forest-soft/50">
            Admission d&apos;excellence
          </span>
        )}
        {badges.map((b) => (
          <span
            key={b.titre}
            title={b.description}
            className="text-xs border border-ink text-ink px-2.5 py-1 bg-paper-dim"
          >
            {b.icone} {b.titre}
          </span>
        ))}
      </div>

      <div className="border-l-2 border-gold bg-white/60 px-5 py-4 mb-10">
        <div className="text-[11px] uppercase tracking-wide text-slate mb-1.5">
          Appréciation du conseil de classe
        </div>
        <p className="font-display text-base text-ink leading-relaxed italic">
          &laquo; {appreciation} &raquo;
        </p>
      </div>

      <h2 className="font-display text-lg text-ink mb-1">📋 Fiche de notes complète</h2>
      <p className="text-xs text-slate mb-3">
        Toutes les années effectuées depuis la 3e, doublées ou non, avec moyenne, rangs et
        commentaire de chaque année.
      </p>
      <div className="mb-10">
        <FicheNotesComplete eleve={eleve} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Évolution</h2>
          <EvolutionCharts eleve={eleve} />

          <h2 className="font-display text-lg text-ink mt-8 mb-3">Compétences</h2>
          <div className="border border-line bg-white/60 p-5">
            <CompetenceBars competences={eleve.competences} />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-3">Historique d&apos;orientation</h2>
          <div className="border border-line bg-white/60 divide-y divide-line mb-8">
            {eleve.historiqueOrientation.length === 0 ? (
              <p className="text-sm text-slate p-4">Aucune orientation enregistrée pour l&apos;instant.</p>
            ) : (
              [...eleve.historiqueOrientation].reverse().map((o, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="text-sm text-ink">
                    {o.niveauOrigine} → {o.niveauDestination}
                  </div>
                  <div className="text-xs text-slate mt-0.5">{o.motif}</div>
                  <div className="text-[11px] text-slate/70 mt-0.5">{o.annee}</div>
                </div>
              ))
            )}
          </div>

          <h2 className="font-display text-lg text-ink mb-3">Journal des événements</h2>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {eleve.evenements.length === 0 ? (
              <p className="text-sm text-slate p-4">Aucun événement particulier pour l&apos;instant.</p>
            ) : (
              [...eleve.evenements].reverse().map((ev) => (
                <div key={ev.id} className="px-4 py-3">
                  <p className="text-sm text-ink">{ev.description}</p>
                  <p className="text-[11px] text-slate mt-0.5">
                    Trimestre {ev.trimestre} · {ev.annee}
                  </p>
                </div>
              ))
            )}
          </div>

          <h2 className="font-display text-lg text-ink mt-8 mb-3">💰 Historique financier</h2>
          <div className="border border-line bg-white/60 divide-y divide-line">
            {!eleve.historiqueFinancier || eleve.historiqueFinancier.length === 0 ? (
              <p className="text-sm text-slate p-4">Aucune récompense perçue pour l&apos;instant.</p>
            ) : (
              eleve.historiqueFinancier.map((t) => (
                <div key={t.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">{t.motif}</p>
                    <p className="text-[11px] text-slate mt-0.5">
                      {t.trimestre ? `Trimestre ${t.trimestre} · ` : ""}
                      {t.annee}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-forest shrink-0">
                    +{formaterFCFA(t.montant)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
