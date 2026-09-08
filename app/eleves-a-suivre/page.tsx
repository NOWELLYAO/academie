"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import RangBadge from "@/components/RangBadge";
import { classerClasse } from "@/lib/engines/ranking";
import { qualifierPotentiel } from "@/lib/engines/potential";
import { genererAppreciationCourte } from "@/lib/engines/narrative";
import { NOM_NIVEAU } from "@/lib/data/subjects";
import { Eleve, Niveau } from "@/lib/models/types";

export default function ElevesASuivrePage() {
  const session = useAcademyStore((s) => s.session);

  const parNiveau = useMemo(() => {
    if (!session) return [];
    const niveaux = Array.from(new Set(session.classes.map((c) => c.niveau)));
    return niveaux.map((niveau) => ({
      niveau,
      classes: session.classes.filter((c) => c.niveau === niveau),
    }));
  }, [session]);

  const profilsASurveiller = useMemo(() => {
    if (!session) return [];
    const eleves = Object.values(session.eleves).filter(
      (e) => e.statut === "actif" || e.statut === "redoublant"
    );

    return eleves
      .map((e) => {
        const potentielMax = Math.max(
          e.potentiel.potentielScientifique,
          e.potentiel.potentielLitteraire
        );
        const derniere = e.moyennes[e.moyennes.length - 1];
        const dernierEvenement = e.evenements[e.evenements.length - 1];
        const evenementNotable =
          dernierEvenement &&
          (dernierEvenement.type === "progression_exceptionnelle" ||
            dernierEvenement.type === "declic");
        const dejaVisible = derniere && derniere.rangClasse > 0 && derniere.rangClasse <= 3;

        const eligible = (potentielMax >= 65 && !dejaVisible) || evenementNotable;

        return { eleve: e, potentielMax, evenementNotable, dernierEvenement, eligible };
      })
      .filter((x) => x.eligible)
      .sort((a, b) => b.potentielMax - a.potentielMax)
      .slice(0, 24);
  }, [session]);

  const nomsClasses = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const carte: Record<string, string> = {};
    session.classes.forEach((c) => (carte[c.id] = c.nom));
    return carte;
  }, [session]);

  const elevesEnDifficulte = useMemo(() => {
    if (!session) return [];
    const eleves = Object.values(session.eleves).filter(
      (e) => e.statut === "actif" || e.statut === "redoublant"
    );

    return eleves
      .map((e) => {
        const derniere = e.moyennes[e.moyennes.length - 1];
        const progression = e.competences.progression ?? 0;
        const enRisque = !!derniere && (derniere.moyenneGenerale < 9 || progression <= -25);
        return { eleve: e, derniere, progression, enRisque };
      })
      .filter((x) => x.enRisque)
      .sort((a, b) => (a.derniere?.moyenneGenerale ?? 0) - (b.derniere?.moyenneGenerale ?? 0))
      .slice(0, 24);
  }, [session]);

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

  return (
    <div className="p-10 max-w-6xl">
      <PageHeader
        eyebrow="Vue d'ensemble"
        title="Élèves à suivre"
        description="Les meilleurs de chaque classe en un coup d'œil, et les profils à fort potentiel qui méritent votre attention — sans avoir à ouvrir chaque classe."
      />

      <h2 className="font-display text-lg text-ink mb-4">🏅 Les stars de chaque classe</h2>
      <div className="space-y-8 mb-12">
        {parNiveau.map(({ niveau, classes }) => (
          <div key={niveau}>
            <div className="text-[11px] uppercase tracking-wide text-gold mb-2">
              {NOM_NIVEAU[niveau as Niveau]}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((c) => {
                const top3 = classerClasse(session, c.id).slice(0, 3);
                return (
                  <div key={c.id} className="border border-line bg-white/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-base text-ink">{c.nom}</span>
                      <Link
                        href={`/classes/${c.id}`}
                        className="text-[11px] text-slate hover:text-ink border-b border-transparent hover:border-gold"
                      >
                        Voir la classe →
                      </Link>
                    </div>
                    {top3.length === 0 ? (
                      <p className="text-xs text-slate">Pas encore de résultats.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {top3.map((e) => (
                          <li key={e.matricule} className="flex items-center justify-between text-sm">
                            <Link
                              href={`/eleves/${e.matricule}`}
                              className="flex items-center min-w-0 hover:text-gold"
                            >
                              <span className="text-slate w-4 shrink-0">{e.rang}</span>
                              <RangBadge rang={e.rang} />
                              <span className="ml-1.5 truncate">
                                {e.nom} {e.prenom}
                              </span>
                            </Link>
                            <span className="tabular-nums text-ink font-medium shrink-0 ml-2">
                              {e.moyenne.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display text-lg text-ink mb-2">✦ Profils à surveiller</h2>
      <p className="text-sm text-slate mb-4 max-w-2xl">
        Élèves à fort potentiel caché encore peu visible dans le classement, ou venant de
        connaître un déclic — des trajectoires qui pourraient surprendre dans les prochains
        trimestres.
      </p>

      {profilsASurveiller.length === 0 ? (
        <p className="text-sm text-slate">
          Aucun profil particulier détecté pour l&apos;instant — avancez la timeline pour en faire
          apparaître.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {profilsASurveiller.map(({ eleve: e, dernierEvenement }: { eleve: Eleve; dernierEvenement?: Eleve["evenements"][number] }) => (
            <Link
              key={e.matricule}
              href={`/eleves/${e.matricule}`}
              className="border border-line bg-white/60 p-4 hover:border-gold transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-ink">
                  {e.nom} {e.prenom}
                </span>
                <span className="text-xs text-slate">{e.matricule}</span>
              </div>
              <div className="text-xs text-slate mb-2">{nomsClasses[e.classeId] ?? e.classeId}</div>
              <span className="text-[11px] border border-gold text-ink px-2 py-0.5 bg-gold-soft/40 inline-block">
                {qualifierPotentiel(e)}
              </span>
              {dernierEvenement && (
                <p className="text-xs text-slate mt-2 leading-snug">{dernierEvenement.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-display text-lg text-ink mb-2 mt-12">⚠ Élèves en difficulté</h2>
      <p className="text-sm text-slate mb-4 max-w-2xl">
        Moyenne générale sous la barre des 9/20 ou net décrochage constaté sur les derniers
        trimestres — des situations qui méritent un accompagnement rapproché.
      </p>

      {elevesEnDifficulte.length === 0 ? (
        <p className="text-sm text-slate">
          Aucun élève en situation de décrochage identifié pour l&apos;instant.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {elevesEnDifficulte.map(({ eleve: e, derniere, progression }) => (
            <Link
              key={e.matricule}
              href={`/eleves/${e.matricule}`}
              className="border border-line bg-white/60 p-4 hover:border-burgundy transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-ink">
                  {e.nom} {e.prenom}
                </span>
                <span className="text-xs text-slate">{e.matricule}</span>
              </div>
              <div className="text-xs text-slate mb-2">{nomsClasses[e.classeId] ?? e.classeId}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs border border-burgundy text-burgundy px-2 py-0.5 bg-burgundy-soft/40 inline-block">
                  Moy. {derniere ? derniere.moyenneGenerale.toFixed(2) : "—"}
                </span>
                {progression < 0 && (
                  <span className="text-xs text-burgundy">▼ {Math.abs(progression)}</span>
                )}
              </div>
              <p className="text-xs text-slate leading-snug">{genererAppreciationCourte(e)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
