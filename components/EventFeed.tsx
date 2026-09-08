import { Eleve, EvenementScolaire } from "@/lib/models/types";

const ICONE: Record<EvenementScolaire["type"], string> = {
  progression_exceptionnelle: "↗",
  baisse_niveau: "↘",
  changement_profil: "◆",
  declic: "✦",
  irregularite: "≈",
};

const COULEUR: Record<EvenementScolaire["type"], string> = {
  progression_exceptionnelle: "text-forest",
  baisse_niveau: "text-burgundy",
  changement_profil: "text-gold",
  declic: "text-forest",
  irregularite: "text-slate",
};

export default function EventFeed({
  eleves,
  limite = 15,
}: {
  eleves: Eleve[];
  limite?: number;
}) {
  const evenements = eleves
    .flatMap((e) => e.evenements.map((ev) => ({ ...ev, matricule: e.matricule })))
    .sort((a, b) => (a.trimestre < b.trimestre ? 1 : -1))
    .slice(0, limite);

  if (evenements.length === 0) {
    return (
      <p className="text-sm text-slate">
        Aucun fait marquant pour l&apos;instant — avancez la timeline pour en générer.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {evenements.map((ev) => (
        <li key={ev.id} className="py-2.5 flex items-start gap-3">
          <span className={`text-lg leading-none mt-0.5 ${COULEUR[ev.type]}`}>
            {ICONE[ev.type]}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink">{ev.description}</p>
            <p className="text-xs text-slate mt-0.5">
              {ev.matricule} · Trimestre {ev.trimestre} · {ev.annee}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
