"use client";

import { useMemo, useState } from "react";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import {
  listerGroupesNiveau,
  statutNotationNiveau,
  statutExamenNiveau,
  statutOrientationNiveau,
} from "@/lib/engines/simulation";

const ETAPES = [
  { id: "T1", label: "Trimestre 1" },
  { id: "T2", label: "Trimestre 2" },
  { id: "T3", label: "Trimestre 3" },
  { id: "examen", label: "Examen (BEPC / Bac)" },
  { id: "orientation", label: "Orientation" },
  { id: "annee_suivante", label: "Année suivante" },
];

const LIBELLE_ACTION: Record<string, string> = {
  T1: "Simuler le trimestre 1",
  T2: "Simuler le trimestre 2",
  T3: "Simuler le trimestre 3",
  examen: "Organiser les examens (BEPC / Bac)",
  orientation: "Calculer l'orientation",
  annee_suivante: "Passer à l'année suivante",
};

function libelleEpreuve(libelleNiveau: string): string {
  if (libelleNiveau === "3e") return "BEPC";
  if (libelleNiveau === "Terminale") return "Bac";
  if (libelleNiveau === "Seconde" || libelleNiveau === "1ère") return "Consolidation";
  return "Session"; // post-bac : session d'examens propre à chaque filière
}

function libelleOrientation(estPostBac: boolean): string {
  return estPostBac ? "Faire progresser" : "Orienter";
}

export default function TimelineControl() {
  const session = useAcademyStore((s) => s.session);
  const avancerEtape = useAcademyStore((s) => s.avancerEtape);
  const dernierResume = useAcademyStore((s) => s.dernierResume);
  const genererNotesPourNiveau = useAcademyStore((s) => s.genererNotesPourNiveau);
  const organiserExamenPourNiveau = useAcademyStore((s) => s.organiserExamenPourNiveau);
  const organiserOrientationPourNiveau = useAcademyStore((s) => s.organiserOrientationPourNiveau);
  const [dernierClic, setDernierClic] = useState<string | null>(null);

  const groupes = useMemo(() => (session ? listerGroupesNiveau(session) : []), [session]);

  if (!session) return null;
  const etapeActuelle = session.anneeCourante.etapeCourante;
  const idxActuel = ETAPES.findIndex((e) => e.id === etapeActuelle);
  const libelleActuel = ETAPES[idxActuel]?.label ?? etapeActuelle;
  const surTrimestre = etapeActuelle === "T1" || etapeActuelle === "T2" || etapeActuelle === "T3";
  const surExamen = etapeActuelle === "examen";
  const surOrientation = etapeActuelle === "orientation";

  function generer(cle: string) {
    genererNotesPourNiveau(cle);
    setDernierClic(cle);
  }

  function examiner(cle: string) {
    organiserExamenPourNiveau(cle);
    setDernierClic(cle);
  }

  function orienter(cle: string) {
    organiserOrientationPourNiveau(cle);
    setDernierClic(cle);
  }

  return (
    <div className="border border-line bg-white/60 px-5 py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate">
            Année {session.anneeCourante.libelle}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {ETAPES.map((etape, i) => (
              <div key={etape.id} className="flex items-center gap-1.5">
                <div
                  className={`h-2 w-2 rounded-full ${
                    i < idxActuel
                      ? "bg-forest"
                      : i === idxActuel
                      ? "bg-gold"
                      : "bg-line"
                  }`}
                  title={etape.label}
                />
                {i < ETAPES.length - 1 && <div className="w-4 h-px bg-line" />}
              </div>
            ))}
          </div>
          <div className="text-sm text-ink mt-2">
            Étape actuelle : <span className="font-medium">{libelleActuel}</span>
          </div>
        </div>
        <button
          onClick={avancerEtape}
          className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors shrink-0"
        >
          {LIBELLE_ACTION[etapeActuelle]} →
        </button>
      </div>

      {dernierResume && (
        <div className="mt-4 border-l-2 border-gold bg-gold-soft/20 px-4 py-2.5 text-sm text-ink">
          {dernierResume}
        </div>
      )}

      {surTrimestre && groupes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-[11px] uppercase tracking-wide text-slate mb-2">
            Accès rapide — un bouton par niveau (Trimestre {session.anneeCourante.trimestreCourant})
          </div>
          <div className="flex flex-wrap gap-2">
            {groupes.map((g) => {
              const statut = statutNotationNiveau(session, g);
              const vientDetreClique = dernierClic === g.cle;
              return (
                <button
                  key={g.cle}
                  onClick={() => generer(g.cle)}
                  title={`${g.classes.length} classe${g.classes.length > 1 ? "s" : ""} · ${g.nbEleves} élèves`}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    statut === "complet"
                      ? "border-forest text-forest bg-forest-soft/30"
                      : statut === "partiel"
                      ? "border-gold text-ink bg-gold-soft/30"
                      : "border-line text-slate hover:border-ink hover:text-ink"
                  } ${vientDetreClique ? "ring-1 ring-gold" : ""}`}
                >
                  {statut === "complet" ? "✓ " : ""}
                  {g.libelle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {surExamen && groupes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-[11px] uppercase tracking-wide text-slate mb-2">
            Accès rapide — BEPC pour la 3e, Bac pour la Terminale, session d&apos;examens propre à
            chaque filière post-bac, consolidation annuelle pour la Seconde et la Première
          </div>
          <div className="flex flex-wrap gap-2">
            {groupes.map((g) => {
              const statut = statutExamenNiveau(session, g);
              const vientDetreClique = dernierClic === g.cle;
              return (
                <button
                  key={g.cle}
                  onClick={() => examiner(g.cle)}
                  title={`${g.classes.length} classe${g.classes.length > 1 ? "s" : ""} · ${g.nbEleves} élèves`}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    statut === "complet"
                      ? "border-forest text-forest bg-forest-soft/30"
                      : statut === "partiel"
                      ? "border-gold text-ink bg-gold-soft/30"
                      : "border-line text-slate hover:border-ink hover:text-ink"
                  } ${vientDetreClique ? "ring-1 ring-gold" : ""}`}
                >
                  {statut === "complet" ? "✓ " : ""}
                  {libelleEpreuve(g.libelle)} — {g.libelle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {surOrientation && groupes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-[11px] uppercase tracking-wide text-slate mb-2">
            Accès rapide — passage/redoublement pour le secondaire, progression d&apos;année pour le
            post-bac (processus différents par niveau)
          </div>
          <div className="flex flex-wrap gap-2">
            {groupes.map((g) => {
              const statut = statutOrientationNiveau(session, g);
              const vientDetreClique = dernierClic === g.cle;
              return (
                <button
                  key={g.cle}
                  onClick={() => orienter(g.cle)}
                  title={`${g.classes.length} classe${g.classes.length > 1 ? "s" : ""} · ${g.nbEleves} élèves`}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    statut === "complet"
                      ? "border-forest text-forest bg-forest-soft/30"
                      : statut === "partiel"
                      ? "border-gold text-ink bg-gold-soft/30"
                      : "border-line text-slate hover:border-ink hover:text-ink"
                  } ${vientDetreClique ? "ring-1 ring-gold" : ""}`}
                >
                  {statut === "complet" ? "✓ " : ""}
                  {libelleOrientation(g.estPostBac)} — {g.libelle}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
