"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import { LIBELLE_MENTION, NiveauMention, calculerMention } from "@/lib/engines/mentions";
import { calculerBadges } from "@/lib/engines/badges";

const ORDRE_MENTIONS: NiveauMention[] = ["felicitations", "tableau_honneur", "encouragements"];

const STYLE_MENTION: Record<NiveauMention, string> = {
  felicitations: "border-gold bg-gold-soft/30",
  tableau_honneur: "border-forest bg-forest-soft/30",
  encouragements: "border-line bg-white/60",
};

export default function TableauHonneurPage() {
  const session = useAcademyStore((s) => s.session);
  const [portee, setPortee] = useState<"generation" | "classe">("generation");
  const [classeId, setClasseId] = useState("");
  const [trimestre, setTrimestre] = useState<1 | 2 | 3>(1);

  const anneeCourante = session?.anneeCourante.libelle ?? "";

  const groupes = useMemo(() => {
    if (!session) return null;
    let eleves = Object.values(session.eleves);
    if (portee === "classe") {
      const classe = session.classes.find((c) => c.id === classeId);
      eleves = classe ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean) : [];
    }

    const resultat: Record<NiveauMention, { eleve: (typeof eleves)[number]; moyenne: number }[]> = {
      felicitations: [],
      tableau_honneur: [],
      encouragements: [],
    };

    eleves.forEach((e) => {
      const entree = e.moyennes.find((m) => m.trimestre === trimestre && m.annee === anneeCourante);
      if (!entree) return;
      const mention = calculerMention(entree.moyenneGenerale);
      if (mention) resultat[mention].push({ eleve: e, moyenne: entree.moyenneGenerale });
    });

    ORDRE_MENTIONS.forEach((m) => resultat[m].sort((a, b) => b.moyenne - a.moyenne));
    return resultat;
  }, [session, portee, classeId, trimestre, anneeCourante]);

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

  const totalMentions = groupes
    ? groupes.felicitations.length + groupes.tableau_honneur.length + groupes.encouragements.length
    : 0;

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <PageHeader
        eyebrow="🏅 Distinction trimestrielle"
        title="Tableau d'honneur"
        description="Félicitations (≥16), Tableau d'honneur (≥14) et Encouragements (≥12) — la reconnaissance classique du mérite scolaire, trimestre par trimestre."
      />

      <div className="flex gap-3 mb-8 flex-wrap items-center">
        <div className="flex border border-line bg-white/60">
          <button
            onClick={() => setPortee("generation")}
            className={`px-4 py-2 text-sm ${portee === "generation" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Génération
          </button>
          <button
            onClick={() => {
              setPortee("classe");
              if (!classeId && session.classes[0]) setClasseId(session.classes[0].id);
            }}
            className={`px-4 py-2 text-sm ${portee === "classe" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Par classe
          </button>
        </div>

        {portee === "classe" && (
          <select
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {session.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        )}

        <div className="flex border border-line bg-white/60">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => setTrimestre(t as 1 | 2 | 3)}
              className={`px-4 py-2 text-sm ${trimestre === t ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
            >
              Trimestre {t}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate">{anneeCourante}</span>
      </div>

      {totalMentions === 0 ? (
        <p className="text-sm text-slate">
          Aucune mention pour ce trimestre — avancez la timeline jusqu&apos;à ce trimestre depuis le
          tableau de bord.
        </p>
      ) : (
        <div className="space-y-8">
          {ORDRE_MENTIONS.map((mention) => (
            <div key={mention}>
              <h2 className="font-display text-lg text-ink mb-3">
                {LIBELLE_MENTION[mention]}{" "}
                <span className="text-sm text-slate font-normal">
                  ({groupes![mention].length} élève{groupes![mention].length > 1 ? "s" : ""})
                </span>
              </h2>
              {groupes![mention].length === 0 ? (
                <p className="text-sm text-slate">Aucun élève dans cette catégorie ce trimestre.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupes![mention].slice(0, 30).map(({ eleve: e, moyenne }) => {
                    const badges = calculerBadges(e);
                    return (
                      <Link
                        key={e.matricule}
                        href={`/eleves/${e.matricule}`}
                        className={`border px-4 py-3 hover:opacity-80 transition-opacity ${STYLE_MENTION[mention]}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={34} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-ink truncate">
                              {e.nom} {e.prenom}
                            </div>
                            <div className="text-xs text-slate">{e.matricule}</div>
                          </div>
                          <div className="ml-auto font-display text-lg text-ink shrink-0">
                            {moyenne.toFixed(2)}
                          </div>
                        </div>
                        {badges.length > 0 && (
                          <div className="mt-2 text-xs text-slate">
                            {badges.slice(0, 2).map((b) => `${b.icone} ${b.titre}`).join(" · ")}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
