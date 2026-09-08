"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { MATIERES } from "@/lib/data/subjects";
import { derniereMoyenneMatiere } from "@/lib/engines/ranking";
import { Eleve, SubjectKey } from "@/lib/models/types";

type Mode = "classes" | "eleve";

function moyenneClassePourMatiere(eleves: Eleve[], matiereKey: SubjectKey): number | null {
  const valeurs = eleves
    .map((e) => derniereMoyenneMatiere(e, matiereKey))
    .filter((v): v is number => v !== null);
  if (valeurs.length === 0) return null;
  return Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 100) / 100;
}

export default function ComparateurPage() {
  const session = useAcademyStore((s) => s.session);
  const [mode, setMode] = useState<Mode>("classes");
  const [classeA, setClasseA] = useState("");
  const [classeB, setClasseB] = useState("");
  const [matriculeEleve, setMatriculeEleve] = useState("");

  const classeAInfo = session?.classes.find((c) => c.id === classeA);
  const classeBInfo = session?.classes.find((c) => c.id === classeB);
  const eleve = matriculeEleve ? session?.eleves[matriculeEleve] : undefined;

  const dataClasses = useMemo(() => {
    if (!session || !classeAInfo || !classeBInfo) return [];
    const elevesA = classeAInfo.matricules.map((m) => session.eleves[m]).filter(Boolean);
    const elevesB = classeBInfo.matricules.map((m) => session.eleves[m]).filter(Boolean);

    return MATIERES.map((m) => {
      const moyA = moyenneClassePourMatiere(elevesA, m.key);
      const moyB = moyenneClassePourMatiere(elevesB, m.key);
      if (moyA === null && moyB === null) return null;
      return { matiere: m.nom, [classeAInfo.nom]: moyA ?? 0, [classeBInfo.nom]: moyB ?? 0 };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [session, classeAInfo, classeBInfo]);

  const dataEleve = useMemo(() => {
    if (!session || !eleve) return [];
    const classe = session.classes.find((c) => c.id === eleve.classeId);
    const eleves = classe ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean) : [];

    return MATIERES.map((m) => {
      const moyEleve = derniereMoyenneMatiere(eleve, m.key);
      const moyClasse = moyenneClassePourMatiere(eleves, m.key);
      if (moyEleve === null && moyClasse === null) return null;
      return {
        matiere: m.nom,
        [`${eleve.nom} ${eleve.prenom}`]: moyEleve ?? 0,
        "Moyenne de la classe": moyClasse ?? 0,
      };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [session, eleve]);

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
    <div className="p-10 max-w-5xl">
      <PageHeader
        eyebrow="Comparateur"
        title="Comparer les performances"
        description="Comparez deux classes matière par matière, ou un élève à la moyenne de sa propre classe."
      />

      <div className="flex border border-line bg-white/60 mb-6 w-fit">
        <button
          onClick={() => setMode("classes")}
          className={`px-4 py-2 text-sm ${mode === "classes" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          Classe vs Classe
        </button>
        <button
          onClick={() => setMode("eleve")}
          className={`px-4 py-2 text-sm ${mode === "eleve" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
        >
          Élève vs sa classe
        </button>
      </div>

      {mode === "classes" ? (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Classe A</label>
              <select
                value={classeA}
                onChange={(e) => setClasseA(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {session.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Classe B</label>
              <select
                value={classeB}
                onChange={(e) => setClasseB(e.target.value)}
                className="border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {session.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {dataClasses.length === 0 ? (
            <p className="text-sm text-slate">Sélectionnez deux classes pour lancer la comparaison.</p>
          ) : (
            <div className="border border-line bg-white/60 p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataClasses}>
                  <CartesianGrid stroke="#DCD9CE" vertical={false} />
                  <XAxis dataKey="matiere" tick={{ fontSize: 11, fill: "#55607A" }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey={classeAInfo?.nom ?? "Classe A"} fill="#101B33" radius={[2, 2, 0, 0]} />
                  <Bar dataKey={classeBInfo?.nom ?? "Classe B"} fill="#C9A227" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">
              Matricule de l&apos;élève
            </label>
            <input
              value={matriculeEleve}
              onChange={(e) => setMatriculeEleve(e.target.value.toUpperCase())}
              placeholder="ex: A027"
              className="border border-line bg-white px-3 py-2 text-sm w-40"
            />
          </div>

          {!eleve ? (
            <p className="text-sm text-slate">Saisissez un matricule valide pour lancer la comparaison.</p>
          ) : (
            <>
              <p className="text-sm text-ink mb-4">
                {eleve.nom} {eleve.prenom} —{" "}
                {session.classes.find((c) => c.id === eleve.classeId)?.nom ?? eleve.classeId}
              </p>
              <div className="border border-line bg-white/60 p-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataEleve}>
                    <CartesianGrid stroke="#DCD9CE" vertical={false} />
                    <XAxis dataKey="matiere" tick={{ fontSize: 11, fill: "#55607A" }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} width={28} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={`${eleve.nom} ${eleve.prenom}`} fill="#101B33" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Moyenne de la classe" fill="#C9A227" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
