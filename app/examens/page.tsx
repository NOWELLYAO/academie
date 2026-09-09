"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import RangBadge from "@/components/RangBadge";
import { listerResultatsExamens, anneesDisponibles } from "@/lib/engines/examens";
import { LIBELLE_MENTION } from "@/lib/engines/mentions";

const SERIES = ["Toutes", "C", "D", "A"];

export default function ExamensPage() {
  const session = useAcademyStore((s) => s.session);
  const [type, setType] = useState<"BEPC" | "Bac">("Bac");
  const [annee, setAnnee] = useState<string>("");
  const [serie, setSerie] = useState("Toutes");

  const tousResultats = useMemo(() => (session ? listerResultatsExamens(session) : []), [session]);
  const annees = useMemo(() => anneesDisponibles(tousResultats), [tousResultats]);
  const anneeActive = annee || annees[0] || "";

  const resultats = useMemo(() => {
    return tousResultats.filter((r) => {
      if (r.type !== type) return false;
      if (anneeActive && r.annee !== anneeActive) return false;
      if (type === "Bac" && serie !== "Toutes" && r.serie !== serie) return false;
      return true;
    });
  }, [tousResultats, type, anneeActive, serie]);

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

  if (tousResultats.length === 0) {
    return (
      <div className="p-10 max-w-3xl">
        <PageHeader
          eyebrow="📊 KPIs d'examen"
          title="Examens"
          description="Aucun examen n'a encore été passé — avancez la timeline jusqu'à l'étape « Examen » pour la 3e ou la Terminale."
        />
      </div>
    );
  }

  const nbCandidats = resultats.length;
  const nbAdmis = resultats.filter((r) => r.moyenne >= 10).length;
  const tauxReussite = nbCandidats ? Math.round((nbAdmis / nbCandidats) * 100) : 0;
  const moyennePoints = nbCandidats
    ? resultats.reduce((a, r) => a + r.points, 0) / nbCandidats
    : 0;
  const pointsMax = resultats[0]?.pointsMax ?? (type === "BEPC" ? 360 : 400);
  const meilleur = resultats[0];

  const parMention = resultats.reduce<Record<string, number>>((acc, r) => {
    const cle = r.mention ?? "aucune";
    acc[cle] = (acc[cle] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-10 max-w-5xl">
      <PageHeader
        eyebrow="📊 KPIs d'examen"
        title="Examens"
        description="Résultats et meilleurs élèves au BEPC et au Baccalauréat, année par année."
      />

      <div className="flex gap-3 mb-8 flex-wrap items-center">
        <div className="flex border border-line bg-white/60">
          <button
            onClick={() => { setType("BEPC"); setSerie("Toutes"); }}
            className={`px-4 py-2 text-sm ${type === "BEPC" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            BEPC (3e)
          </button>
          <button
            onClick={() => setType("Bac")}
            className={`px-4 py-2 text-sm ${type === "Bac" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Baccalauréat
          </button>
        </div>

        <select
          value={anneeActive}
          onChange={(e) => setAnnee(e.target.value)}
          className="border border-line bg-white px-3 py-2 text-sm"
        >
          {annees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {type === "Bac" && (
          <div className="flex border border-line bg-white/60">
            {SERIES.map((s) => (
              <button
                key={s}
                onClick={() => setSerie(s)}
                className={`px-3 py-2 text-sm ${serie === s ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
              >
                {s === "Toutes" ? "Toutes séries" : `Série ${s}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {resultats.length === 0 ? (
        <p className="text-sm text-slate">Aucun résultat pour ce filtre.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Candidats" value={nbCandidats} />
            <StatCard label="Taux de réussite" value={`${tauxReussite}%`} accent="forest" />
            <StatCard
              label="Moyenne des points"
              value={`${Math.round(moyennePoints)}/${pointsMax}`}
              accent="gold"
            />
            <StatCard
              label="Meilleur score"
              value={`${meilleur.points}/${pointsMax}`}
              accent="gold"
              sub={`${meilleur.nom} ${meilleur.prenom}`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {(["felicitations", "tableau_honneur", "encouragements"] as const).map((m) => (
              <StatCard
                key={m}
                label={LIBELLE_MENTION[m]}
                value={parMention[m] ?? 0}
                sub={`${Math.round(((parMention[m] ?? 0) / nbCandidats) * 100)}% des candidats`}
              />
            ))}
            <StatCard
              label="Sans mention"
              value={parMention["aucune"] ?? 0}
              accent="burgundy"
              sub={`${Math.round(((parMention["aucune"] ?? 0) / nbCandidats) * 100)}% des candidats`}
            />
          </div>

          <div className="border border-gold bg-gold-soft/20 px-5 py-4 mb-10 flex items-center gap-4">
            <Avatar matricule={meilleur.matricule} nom={meilleur.nom} prenom={meilleur.prenom} size={44} />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate">
                🏆 Major — {type} {anneeActive} {type === "Bac" && serie !== "Toutes" ? `(série ${serie})` : ""}
              </div>
              <Link
                href={`/eleves/${meilleur.matricule}`}
                className="font-display text-lg text-ink hover:text-gold"
              >
                {meilleur.nom} {meilleur.prenom}
              </Link>
              <div className="text-xs text-slate">
                {meilleur.classeNom} · {meilleur.points}/{meilleur.pointsMax} points · moyenne {meilleur.moyenne.toFixed(2)}/20
              </div>
            </div>
          </div>

          <h2 className="font-display text-lg text-ink mb-3">Classement</h2>
          <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th></th>
                  <th>Élève</th>
                  <th>Classe</th>
                  {type === "Bac" && <th>Série</th>}
                  <th>Points</th>
                  <th>Moyenne /20</th>
                  <th>Mention</th>
                </tr>
              </thead>
              <tbody>
                {resultats.slice(0, 50).map((r, i) => (
                  <tr key={r.matricule}>
                    <td className="text-slate">
                      <span className="inline-flex items-center">
                        {i + 1}
                        <RangBadge rang={i + 1} />
                      </span>
                    </td>
                    <td>
                      <Avatar matricule={r.matricule} nom={r.nom} prenom={r.prenom} size={26} />
                    </td>
                    <td>
                      <Link href={`/eleves/${r.matricule}`} className="hover:text-gold">
                        {r.nom} {r.prenom}
                      </Link>
                    </td>
                    <td className="text-slate">{r.classeNom}</td>
                    {type === "Bac" && <td className="text-slate">{r.serie ?? "—"}</td>}
                    <td className="font-medium tabular-nums">
                      {r.points}/{r.pointsMax}
                    </td>
                    <td className="tabular-nums">{r.moyenne.toFixed(2)}</td>
                    <td>
                      {r.mention ? (
                        <span className="text-xs border border-gold text-ink px-1.5 py-0.5 bg-gold-soft/30">
                          {LIBELLE_MENTION[r.mention]}
                        </span>
                      ) : (
                        <span className="text-slate text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
