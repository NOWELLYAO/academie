"use client";

import { useAcademyStore } from "@/lib/store/useAcademyStore";

const ETAPES = [
  { id: "T1", label: "Trimestre 1" },
  { id: "T2", label: "Trimestre 2" },
  { id: "T3", label: "Trimestre 3" },
  { id: "examen", label: "Examen" },
  { id: "orientation", label: "Orientation" },
  { id: "annee_suivante", label: "Année suivante" },
];

const LIBELLE_ACTION: Record<string, string> = {
  T1: "Simuler le trimestre 1",
  T2: "Simuler le trimestre 2",
  T3: "Simuler le trimestre 3",
  examen: "Clôturer l'année (BEPC / Bac pour 3e & Tle)",
  orientation: "Calculer l'orientation",
  annee_suivante: "Passer à l'année suivante",
};

export default function TimelineControl() {
  const session = useAcademyStore((s) => s.session);
  const avancerEtape = useAcademyStore((s) => s.avancerEtape);

  if (!session) return null;
  const etapeActuelle = session.anneeCourante.etapeCourante;
  const idxActuel = ETAPES.findIndex((e) => e.id === etapeActuelle);

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
        </div>
        <button
          onClick={avancerEtape}
          className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors"
        >
          {LIBELLE_ACTION[etapeActuelle]} →
        </button>
      </div>
    </div>
  );
}
