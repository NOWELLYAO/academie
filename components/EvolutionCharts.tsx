"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Eleve, SubjectKey } from "@/lib/models/types";
import { MATIERES } from "@/lib/data/subjects";

type Vue = "generale" | "matiere" | "rang";

export default function EvolutionCharts({ eleve }: { eleve: Eleve }) {
  const [vue, setVue] = useState<Vue>("generale");

  const matieresDisponibles = useMemo(() => {
    const presentes = new Set<SubjectKey>();
    eleve.moyennes.forEach((m) => m.parMatiere.forEach((pm) => presentes.add(pm.matiere)));
    return MATIERES.filter((m) => presentes.has(m.key));
  }, [eleve]);

  const [matiereChoisie, setMatiereChoisie] = useState<SubjectKey | "">(
    matieresDisponibles[0]?.key ?? ""
  );

  const labelPoint = (m: Eleve["moyennes"][number]) => `T${m.trimestre} ${m.annee.split("-")[0]}`;

  const dataGenerale = eleve.moyennes.map((m) => ({
    label: labelPoint(m),
    moyenne: m.moyenneGenerale,
  }));

  const dataMatiere = useMemo(() => {
    if (!matiereChoisie) return [];
    return eleve.moyennes
      .map((m) => {
        const entree = m.parMatiere.find((pm) => pm.matiere === matiereChoisie);
        return entree ? { label: labelPoint(m), moyenne: entree.moyenne } : null;
      })
      .filter((x): x is { label: string; moyenne: number } => x !== null);
  }, [eleve, matiereChoisie]);

  const dataRang = eleve.moyennes.map((m) => ({
    label: labelPoint(m),
    "Rang classe": m.rangClasse || null,
    "Rang génération": m.rangGeneration || null,
  }));

  const donneesInsuffisantes =
    (vue === "generale" && dataGenerale.length < 2) ||
    (vue === "matiere" && dataMatiere.length < 2) ||
    (vue === "rang" && dataRang.length < 2);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex border border-line bg-white/60 text-xs">
          <button
            onClick={() => setVue("generale")}
            className={`px-3 py-1.5 ${vue === "generale" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Moyenne générale
          </button>
          <button
            onClick={() => setVue("matiere")}
            className={`px-3 py-1.5 ${vue === "matiere" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Par matière
          </button>
          <button
            onClick={() => setVue("rang")}
            className={`px-3 py-1.5 ${vue === "rang" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Rang
          </button>
        </div>

        {vue === "matiere" && matieresDisponibles.length > 0 && (
          <select
            value={matiereChoisie}
            onChange={(e) => setMatiereChoisie(e.target.value as SubjectKey)}
            className="border border-line bg-white px-2 py-1.5 text-xs"
          >
            {matieresDisponibles.map((m) => (
              <option key={m.key} value={m.key}>
                {m.nom}
              </option>
            ))}
          </select>
        )}
      </div>

      {donneesInsuffisantes ? (
        <p className="text-sm text-slate">
          Pas encore assez de données — avancez la timeline pour suivre l&apos;évolution.
        </p>
      ) : (
        <div className="border border-line bg-white/60 p-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            {vue === "rang" ? (
              <LineChart data={dataRang}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis
                  reversed
                  tick={{ fontSize: 11, fill: "#55607A" }}
                  width={32}
                  label={{ value: "1 = meilleur rang", angle: -90, position: "insideLeft", fontSize: 10, fill: "#55607A" }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Rang classe" stroke="#101B33" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="Rang génération" stroke="#C9A227" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            ) : (
              <LineChart data={vue === "generale" ? dataGenerale : dataMatiere}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="moyenne"
                  stroke="#101B33"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#C9A227" }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
