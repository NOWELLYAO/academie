"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import FavoriteStar from "@/components/FavoriteStar";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { genererAppreciationCourte } from "@/lib/engines/narrative";
import { qualifierPotentiel } from "@/lib/engines/potential";

export default function FavorisPage() {
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

  const favoris = (session.favoris ?? [])
    .map((m) => session.eleves[m])
    .filter(Boolean);

  return (
    <div className="p-10 max-w-6xl">
      <PageHeader
        eyebrow="★ Suivi personnalisé"
        title="Mes favoris"
        description="Marquez des élèves comme favoris depuis leur fiche ou n'importe quel tableau (icône ☆) pour suivre leur évolution ici, sans avoir à les rechercher à chaque fois."
      />

      {favoris.length === 0 ? (
        <div className="border border-line bg-white/60 p-8 text-center max-w-lg">
          <p className="text-sm text-slate mb-4">
            Vous n&apos;avez encore marqué aucun élève comme favori. Parcourez les élèves et
            cliquez sur l&apos;étoile ☆ pour les ajouter ici.
          </p>
          <Link
            href="/eleves"
            className="inline-block bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors"
          >
            Parcourir les élèves →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favoris.map((e) => {
            const derniere = e.moyennes[e.moyennes.length - 1];
            const nomClasse = session.classes.find((c) => c.id === e.classeId)?.nom ?? e.classeId;
            const dataGraphique = e.moyennes.map((m) => ({
              label: `T${m.trimestre} ${m.annee.split("-")[0]}`,
              moyenne: m.moyenneGenerale,
            }));
            const progression = e.competences.progression ?? 0;

            return (
              <div key={e.matricule} className="border border-line bg-white/60 p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <Link
                      href={`/eleves/${e.matricule}`}
                      className="font-display text-lg text-ink hover:text-gold"
                    >
                      {e.nom} {e.prenom}
                    </Link>
                    <div className="text-xs text-slate mt-0.5">
                      {e.matricule} · {nomClasse} · {NOM_NIVEAU[e.niveau]}
                    </div>
                  </div>
                  <FavoriteStar matricule={e.matricule} size="text-xl" />
                </div>

                <div className="flex items-center gap-4 my-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate">Moyenne</div>
                    <div className="font-display text-2xl text-ink">
                      {derniere ? derniere.moyenneGenerale.toFixed(2) : "—"}
                    </div>
                  </div>
                  {derniere && (
                    <div className="text-xs text-slate">
                      Rang {derniere.rangClasse} classe
                      <br />
                      {derniere.rangGeneration} génération
                    </div>
                  )}
                  {progression !== 0 && (
                    <span className={progression > 0 ? "text-forest text-sm" : "text-burgundy text-sm"}>
                      {progression > 0 ? "▲" : "▼"} {Math.abs(progression)}
                    </span>
                  )}
                  <span className="text-[11px] border border-gold text-ink px-2 py-0.5 bg-gold-soft/40 ml-auto">
                    {qualifierPotentiel(e)}
                  </span>
                </div>

                {dataGraphique.length > 1 ? (
                  <div className="h-24 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dataGraphique}>
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#55607A" }} />
                        <YAxis domain={[0, 20]} hide />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="moyenne"
                          stroke="#101B33"
                          strokeWidth={2}
                          dot={{ r: 2.5, fill: "#C9A227" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-slate mb-2">
                    Pas encore assez de données pour tracer une évolution.
                  </p>
                )}

                <p className="text-xs text-slate mt-2 leading-snug border-t border-line pt-2">
                  {genererAppreciationCourte(e)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
