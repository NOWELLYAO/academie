"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import { listerPromos, elevesDeLaPromo, parcoursResume, classeOrigine } from "@/lib/engines/promotions";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { formaterFCFA } from "@/lib/engines/finances";

function formaterFCFACourt(montant: number): string {
  if (montant >= 1000000) return `${(montant / 1000000).toFixed(1)}M`;
  if (montant >= 1000) return `${Math.round(montant / 1000)}k`;
  return `${montant}`;
}

export default function PromotionsPage() {
  const session = useAcademyStore((s) => s.session);
  const [promoChoisie, setPromoChoisie] = useState<string>("");

  const promos = useMemo(() => (session ? listerPromos(session) : []), [session]);
  const promoActive = promoChoisie || promos[0] || "";

  const eleves = useMemo(
    () => (session && promoActive ? elevesDeLaPromo(session, promoActive) : []),
    [session, promoActive]
  );

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

  if (promos.length === 0) {
    return (
      <div className="p-5 md:p-10 max-w-3xl">
        <PageHeader
          eyebrow="🎓 Anciens élèves"
          title="Promotions"
          description="Aucun diplômé pour l'instant — avancez la timeline jusqu'à ce que des élèves terminent leur cursus post-bac."
        />
      </div>
    );
  }

  const salaireMoyen = eleves.length
    ? eleves.reduce((a, e) => a + (e.carriere?.salaireMensuel ?? 0), 0) / eleves.length
    : 0;
  const maries = eleves.filter((e) => e.marie).length;

  return (
    <div className="p-5 md:p-10 max-w-7xl">
      <PageHeader
        eyebrow="🎓 Anciens élèves"
        title="Promotions"
        description="Sélectionnez une promotion (année de diplôme) pour voir l'évolution complète de chaque élève : classe, filière, postes occupés, salaires, situation personnelle."
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label className="text-xs uppercase tracking-wide text-slate">Promotion</label>
        <select
          value={promoActive}
          onChange={(e) => setPromoChoisie(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          {promos.map((p) => (
            <option key={p} value={p}>
              Promo {p}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate">{eleves.length} diplômé(s) cette année-là</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Diplômés" value={eleves.length} />
        <StatCard label="Salaire moyen actuel" value={formaterFCFA(salaireMoyen)} accent="gold" />
        <StatCard label="Mariés" value={maries} accent="forest" />
        <StatCard
          label="Meilleur salaire"
          value={eleves[0] ? formaterFCFA(eleves[0].carriere!.salaireMensuel) : "—"}
          accent="gold"
        />
      </div>

      <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
        <table className="ledger-table text-[11px]">
          <thead>
            <tr>
              <th className="whitespace-nowrap">Élève</th>
              <th className="whitespace-nowrap">Classe d&apos;origine</th>
              <th className="whitespace-nowrap">Diplôme / Filière</th>
              <th>Parcours professionnel</th>
              <th className="whitespace-nowrap">Salaire actuel</th>
              <th className="whitespace-nowrap">Marié(e) à</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map((e) => {
              const filiere = e.specialiteIngenieur || e.filiereDUT || e.filiereUniversitaire;
              const parcours = parcoursResume(e);
              const conjoint = e.conjointMatricule ? session.eleves[e.conjointMatricule] : null;

              return (
                <tr key={e.matricule}>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={22} />
                      <div>
                        <Link href={`/eleves/${e.matricule}`} className="text-ink hover:text-gold font-medium">
                          {e.nom} {e.prenom}
                        </Link>
                        <div className="text-slate">{e.matricule}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-slate whitespace-nowrap">{classeOrigine(e)}</td>
                  <td className="whitespace-nowrap">
                    <div className="text-ink">{NOM_NIVEAU[e.niveau]}</div>
                    {filiere && <div className="text-slate">{filiere}</div>}
                  </td>
                  <td className="min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 leading-tight">
                      {parcours.map((etape, i) => (
                        <span key={i} className="inline-flex items-center whitespace-nowrap">
                          {i > 0 && <span className="text-slate mx-1">→</span>}
                          <span className="text-ink">{etape.poste}</span>
                          <span className="text-slate ml-1">
                            ({formaterFCFACourt(etape.salaire)}, {etape.annee.split("-")[0]})
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="font-medium tabular-nums whitespace-nowrap">
                    {e.carriere ? formaterFCFA(e.carriere.salaireMensuel) : "—"}
                  </td>
                  <td className="whitespace-nowrap">
                    {conjoint ? (
                      <Link href={`/eleves/${conjoint.matricule}`} className="text-ink hover:text-gold">
                        💍 {conjoint.nom} {conjoint.prenom}
                      </Link>
                    ) : (
                      <span className="text-slate">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
