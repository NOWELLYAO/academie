const LIBELLES: Record<string, string> = {
  mathematiques: "Mathématiques",
  physique: "Physique",
  svt: "SVT",
  francais: "Français",
  anglais: "Anglais",
  informatique: "Informatique",
  philosophie: "Philosophie",
  raisonnementLogique: "Raisonnement logique",
  communication: "Communication",
  regularite: "Régularité",
};

export default function CompetenceBars({
  competences,
}: {
  competences: Record<string, number>;
}) {
  const cles = Object.keys(LIBELLES).filter((k) => competences[k] !== undefined);

  return (
    <div className="space-y-2.5">
      {cles.map((cle) => {
        const valeur = competences[cle];
        const surVingt = cle === "regularite" ? valeur / 5 : valeur;
        const pct = Math.max(0, Math.min(100, (surVingt / 20) * 100));
        return (
          <div key={cle}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate">{LIBELLES[cle]}</span>
              <span className="font-medium text-ink tabular-nums">
                {cle === "regularite" ? Math.round(valeur) : valeur.toFixed(1)}
                {cle === "regularite" ? "/100" : "/20"}
              </span>
            </div>
            <div className="h-1.5 bg-paper-dim rounded-full overflow-hidden">
              <div
                className="h-full bg-ink rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
