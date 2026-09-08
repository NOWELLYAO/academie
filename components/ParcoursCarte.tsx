import { Eleve, Niveau } from "@/lib/models/types";
import { NOM_NIVEAU } from "@/lib/data/subjects";

const ETAPES: { niveaux: Niveau[]; label: string }[] = [
  { niveaux: ["3e"], label: "3e" },
  { niveaux: ["2ndeC", "2ndeA"], label: "Seconde" },
  { niveaux: ["1ereC", "1ereD", "1ereA"], label: "Première" },
  { niveaux: ["TermC", "TermD", "TermA"], label: "Terminale" },
  { niveaux: ["Universite", "EcoleIngenieurs"], label: "Université / École" },
];

export default function ParcoursCarte({ eleve }: { eleve: Eleve }) {
  const etapeActuelleIdx = ETAPES.findIndex((e) => e.niveaux.includes(eleve.niveau));

  return (
    <div className="flex items-center w-full">
      {ETAPES.map((etape, i) => {
        const atteinte = i <= etapeActuelleIdx;
        const actuelle = i === etapeActuelleIdx;
        return (
          <div key={etape.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-3.5 w-3.5 rounded-full border-2 ${
                  actuelle
                    ? "bg-gold border-gold"
                    : atteinte
                    ? "bg-forest border-forest"
                    : "bg-white border-line"
                }`}
              />
              <span
                className={`text-[11px] whitespace-nowrap ${
                  actuelle ? "text-ink font-semibold" : "text-slate"
                }`}
              >
                {actuelle ? NOM_NIVEAU[eleve.niveau] : etape.label}
              </span>
            </div>
            {i < ETAPES.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 mb-4 ${
                  i < etapeActuelleIdx ? "bg-forest" : "bg-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
