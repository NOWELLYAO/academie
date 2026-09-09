"use client";

import { useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import Avatar from "@/components/Avatar";
import { Niveau } from "@/lib/models/types";

type DomaineConcours = "scientifique" | "litteraire" | "technologique" | "naturaliste" | "generale";

interface PresetConcours {
  id: string;
  domaine: DomaineConcours;
  label: string;
  suggestion: string;
  prestige?: boolean; // récompense et badge spéciaux (ex: Concours X / Polytechnique)
}

const PRESETS: PresetConcours[] = [
  { id: "generale", domaine: "generale", label: "Général (toutes matières)", suggestion: "Concours Général — Toutes matières" },
  { id: "maths", domaine: "scientifique", label: "Scientifique (maths/physique)", suggestion: "Concours Général de Mathématiques" },
  {
    id: "polytechnique",
    domaine: "scientifique",
    label: "🏛️ Concours X / Polytechnique",
    suggestion: "Concours X / Polytechnique",
    prestige: true,
  },
  { id: "litteraire", domaine: "litteraire", label: "Littéraire (français/anglais)", suggestion: "Concours d'Éloquence" },
  { id: "technologique", domaine: "technologique", label: "Technologique (info/logique)", suggestion: "Olympiades d'Informatique" },
  { id: "naturaliste", domaine: "naturaliste", label: "Naturaliste (SVT)", suggestion: "Concours des Sciences de la Vie et de la Terre" },
];

const NIVEAUX_GROUPES: { label: string; niveaux: Niveau[] | null }[] = [
  { label: "Toute la génération", niveaux: null },
  { label: "3e", niveaux: ["3e"] },
  { label: "Seconde", niveaux: ["2ndeA", "2ndeC"] },
  { label: "Première", niveaux: ["1ereA", "1ereC", "1ereD"] },
  { label: "Terminale", niveaux: ["TermA", "TermC", "TermD"] },
  { label: "Prépa scientifique (MPSI)", niveaux: ["PrepaScientifique"] },
  { label: "Prépa littéraire (Hypokhâgne)", niveaux: ["PrepaLitteraire"] },
];

const MEDAILLE = ["🥇", "🥈", "🥉"];

export default function ConcoursPage() {
  const session = useAcademyStore((s) => s.session);
  const lancerConcours = useAcademyStore((s) => s.lancerConcours);

  const [presetId, setPresetId] = useState("polytechnique");
  const [nom, setNom] = useState(PRESETS.find((p) => p.id === "polytechnique")!.suggestion);
  // Le Concours X / Polytechnique se prépare en 2e année de prépa scientifique
  const [groupeIdx, setGroupeIdx] = useState(5);

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

  const presetActif = PRESETS.find((p) => p.id === presetId)!;

  function lancer() {
    const groupe = NIVEAUX_GROUPES[groupeIdx];
    lancerConcours(nom || "Concours", presetActif.domaine, groupe.niveaux, groupe.label, presetActif.prestige);
  }

  return (
    <div className="p-10 max-w-4xl">
      <PageHeader
        eyebrow="🏆 Compétition"
        title="Concours"
        description="Organisez un concours dans un domaine et un niveau donnés, et découvrez le podium des meilleurs talents de la génération."
      />

      <div className="border border-line bg-white/60 p-5 mb-10 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Concours</label>
          <select
            value={presetId}
            onChange={(e) => {
              const id = e.target.value;
              setPresetId(id);
              setNom(PRESETS.find((p) => p.id === id)!.suggestion);
            }}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Niveau concerné</label>
          {presetActif.prestige ? (
            <div className="border border-line bg-paper-dim px-3 py-2 text-sm text-slate">
              Prépa scientifique (MPSI) — série C uniquement
            </div>
          ) : (
            <select
              value={groupeIdx}
              onChange={(e) => setGroupeIdx(Number(e.target.value))}
              className="border border-line bg-white px-3 py-2 text-sm"
            >
              {NIVEAUX_GROUPES.map((g, i) => (
                <option key={g.label} value={i}>
                  {g.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 min-w-[220px]">
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Nom du concours</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full border border-line bg-white px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={lancer}
          className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors"
        >
          Lancer le concours →
        </button>
      </div>

      {presetActif.prestige && (
        <div className="border-l-2 border-gold bg-gold-soft/20 px-4 py-2.5 text-sm text-ink -mt-6 mb-10">
          🏛️ Réservé aux élèves de <strong>Prépa scientifique (série C)</strong> — jamais série A. Le
          lauréat reçoit le statut <strong>Admission d&apos;excellence</strong> (comme une admission
          directe en école d&apos;ingénieurs) ainsi qu&apos;une bourse spéciale, en plus de la
          récompense du podium.
        </div>
      )}

      <h2 className="font-display text-lg text-ink mb-3">Palmarès des concours</h2>
      {(!session.concours || session.concours.length === 0) ? (
        <p className="text-sm text-slate">Aucun concours organisé pour l&apos;instant.</p>
      ) : (
        <div className="space-y-5">
          {session.concours.map((c) => (
            <div key={c.id} className="border border-line bg-white/60 p-5">
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                <h3 className="font-display text-base text-ink">{c.nom}</h3>
                <span className="text-xs text-slate">
                  {c.niveauLibelle} · {c.annee}
                </span>
              </div>
              {c.podium.length === 0 ? (
                <p className="text-sm text-slate">Aucun élève éligible pour ce concours.</p>
              ) : (
                <ul className="space-y-2">
                  {c.podium.map((p) => (
                    <li key={p.matricule} className="flex items-center gap-3">
                      <span className="w-6 text-center text-lg">
                        {MEDAILLE[p.rang - 1] ?? <span className="text-slate text-sm">{p.rang}</span>}
                      </span>
                      <Avatar matricule={p.matricule} nom={p.nom} prenom={p.prenom} size={28} />
                      <Link href={`/eleves/${p.matricule}`} className="text-sm text-ink hover:text-gold flex-1">
                        {p.nom} {p.prenom}
                      </Link>
                      <span className="text-sm font-medium tabular-nums">{p.score.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
