"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { MATIERES } from "@/lib/data/subjects";
import { calculerMention, LIBELLE_MENTION, NiveauMention } from "@/lib/engines/mentions";

export default function StatistiquesPage() {
  const session = useAcademyStore((s) => s.session);

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

  const eleves = Object.values(session.eleves);
  const actifs = eleves.filter((e) => e.statut === "actif" || e.statut === "redoublant");

  // Répartition des moyennes par tranche
  const tranches = [
    { label: "0-8", min: 0, max: 8 },
    { label: "8-10", min: 8, max: 10 },
    { label: "10-12", min: 10, max: 12 },
    { label: "12-14", min: 12, max: 14 },
    { label: "14-16", min: 14, max: 16 },
    { label: "16-20", min: 16, max: 20.01 },
  ];
  const moyennes = actifs
    .map((e) => e.moyennes[e.moyennes.length - 1]?.moyenneGenerale)
    .filter((m): m is number => m !== undefined);

  const dataTranches = tranches.map((t) => ({
    tranche: t.label,
    eleves: moyennes.filter((m) => m >= t.min && m < t.max).length,
  }));

  // Moyenne par matière (sur l'ensemble de la génération)
  const dataMatieres = MATIERES.map((m) => {
    const valeurs = actifs.map((e) => e.competences[m.key]).filter((v): v is number => v !== undefined);
    const moyenne = valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : 0;
    return { matiere: m.nom, moyenne: Math.round(moyenne * 100) / 100 };
  }).filter((m) => m.moyenne > 0);

  const matiereForte = [...dataMatieres].sort((a, b) => b.moyenne - a.moyenne)[0];
  const matiereFaible = [...dataMatieres].sort((a, b) => a.moyenne - b.moyenne)[0];

  const progressionMoyenne =
    actifs.reduce((acc, e) => acc + (e.competences.progression ?? 0), 0) / (actifs.length || 1);

  // Mentions du dernier trimestre disponible
  const mentions: Record<NiveauMention, number> = {
    felicitations: 0,
    tableau_honneur: 0,
    encouragements: 0,
  };
  let sansMention = 0;
  actifs.forEach((e) => {
    const derniere = e.moyennes[e.moyennes.length - 1];
    if (!derniere) return;
    const m = calculerMention(derniere.moyenneGenerale);
    if (m) mentions[m]++;
    else sansMention++;
  });
  const totalNote = actifs.filter((e) => e.moyennes.length > 0).length || 1;

  // Répartition par origine
  const parPays = eleves.reduce<Record<string, number>>((acc, e) => {
    acc[e.pays] = (acc[e.pays] ?? 0) + 1;
    return acc;
  }, {});
  const dataOrigines = Object.entries(parPays)
    .map(([pays, n]) => ({ pays, eleves: n }))
    .sort((a, b) => b.eleves - a.eleves);

  // Répartition des profils actuels
  const parProfil = actifs.reduce<Record<string, number>>((acc, e) => {
    acc[e.profilActuel] = (acc[e.profilActuel] ?? 0) + 1;
    return acc;
  }, {});
  const LIBELLE_PROFIL: Record<string, string> = {
    scientifique: "Scientifique",
    litteraire: "Littéraire",
    equilibre: "Équilibré",
    difficulte: "En difficulté",
    irregulier: "Irrégulier",
  };
  const dataProfils = Object.entries(parProfil).map(([profil, n]) => ({
    profil: LIBELLE_PROFIL[profil] ?? profil,
    eleves: n,
  }));

  return (
    <div className="p-5 md:p-10 max-w-6xl">
      <PageHeader eyebrow="Analyse" title="Statistiques de la génération" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Matière la plus réussie" value={matiereForte?.matiere ?? "—"} accent="forest" sub={matiereForte ? `Moy. ${matiereForte.moyenne}` : ""} />
        <StatCard label="Matière la plus difficile" value={matiereFaible?.matiere ?? "—"} accent="burgundy" sub={matiereFaible ? `Moy. ${matiereFaible.moyenne}` : ""} />
        <StatCard label="Progression moyenne" value={progressionMoyenne.toFixed(1)} accent="gold" />
        <StatCard label="Élèves suivis" value={actifs.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg text-ink mb-3">Répartition des moyennes</h2>
          <div className="border border-line bg-white/60 p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTranches}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="tranche" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={30} />
                <Tooltip />
                <Bar dataKey="eleves" fill="#101B33" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-3">Moyenne par matière</h2>
          <div className="border border-line bg-white/60 p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataMatieres} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#DCD9CE" horizontal={false} />
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis dataKey="matiere" type="category" tick={{ fontSize: 11, fill: "#55607A" }} width={90} />
                <Tooltip />
                <Bar dataKey="moyenne" fill="#C9A227" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2 className="font-display text-lg text-ink mt-12 mb-3">Mentions du dernier trimestre</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard
          label={LIBELLE_MENTION.felicitations}
          value={`${Math.round((mentions.felicitations / totalNote) * 100)}%`}
          sub={`${mentions.felicitations} élève(s)`}
          accent="gold"
        />
        <StatCard
          label={LIBELLE_MENTION.tableau_honneur}
          value={`${Math.round((mentions.tableau_honneur / totalNote) * 100)}%`}
          sub={`${mentions.tableau_honneur} élève(s)`}
          accent="forest"
        />
        <StatCard
          label={LIBELLE_MENTION.encouragements}
          value={`${Math.round((mentions.encouragements / totalNote) * 100)}%`}
          sub={`${mentions.encouragements} élève(s)`}
        />
        <StatCard
          label="Sans mention"
          value={`${Math.round((sansMention / totalNote) * 100)}%`}
          sub={`${sansMention} élève(s)`}
          accent="burgundy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg text-ink mb-1">Diversité des origines</h2>
          <p className="text-xs text-slate mb-3">
            {dataOrigines.length} origine{dataOrigines.length > 1 ? "s" : ""} représentée
            {dataOrigines.length > 1 ? "s" : ""} dans la génération.
          </p>
          <div className="border border-line bg-white/60 p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataOrigines} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="#DCD9CE" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#55607A" }} />
                <YAxis dataKey="pays" type="category" tick={{ fontSize: 10, fill: "#55607A" }} width={90} />
                <Tooltip />
                <Bar dataKey="eleves" fill="#2E5C7A" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-ink mb-1">Répartition des profils</h2>
          <p className="text-xs text-slate mb-3">Profil scolaire actuel des élèves (évolue avec les événements).</p>
          <div className="border border-line bg-white/60 p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProfils}>
                <CartesianGrid stroke="#DCD9CE" vertical={false} />
                <XAxis dataKey="profil" tick={{ fontSize: 10, fill: "#55607A" }} />
                <YAxis tick={{ fontSize: 11, fill: "#55607A" }} width={30} />
                <Tooltip />
                <Bar dataKey="eleves" fill="#7A2E3B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
