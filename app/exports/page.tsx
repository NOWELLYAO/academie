"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import RangBadge from "@/components/RangBadge";
import { classerEleves, classerParMatiereListe } from "@/lib/engines/ranking";
import { exporterPDF } from "@/lib/export/pdf";
import { exporterExcel } from "@/lib/export/excel";
import { LigneExport } from "@/lib/export/types";
import { MATIERES, NOM_NIVEAU } from "@/lib/data/subjects";
import { Niveau, SubjectKey } from "@/lib/models/types";

const OPTIONS_TOP = [
  { value: "5", label: "Top 5" },
  { value: "10", label: "Top 10" },
  { value: "20", label: "Top 20" },
  { value: "50", label: "Top 50" },
  { value: "tous", label: "Tous" },
];

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ExportsPage() {
  const session = useAcademyStore((s) => s.session);

  const [portee, setPortee] = useState<"generation" | "classe">("generation");
  const [classeId, setClasseId] = useState("");
  const [niveauFiltre, setNiveauFiltre] = useState<string>("tous");
  const [matiere, setMatiere] = useState<SubjectKey | "general">("general");
  const [top, setTop] = useState("20");

  const niveauxDisponibles = useMemo(() => {
    if (!session) return [];
    return Array.from(new Set(Object.values(session.eleves).map((e) => e.niveau)));
  }, [session]);

  const nomsClasses = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const carte: Record<string, string> = {};
    session.classes.forEach((c) => (carte[c.id] = c.nom));
    return carte;
  }, [session]);

  const lignes: LigneExport[] = useMemo(() => {
    if (!session) return [];

    let baseEleves = Object.values(session.eleves).filter(
      (e) => e.statut === "actif" || e.statut === "redoublant"
    );

    if (portee === "classe") {
      const classe = session.classes.find((c) => c.id === classeId);
      baseEleves = classe
        ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean)
        : [];
    } else if (niveauFiltre !== "tous") {
      baseEleves = baseEleves.filter((e) => e.niveau === niveauFiltre);
    }

    const classement =
      matiere === "general"
        ? classerEleves(baseEleves, nomsClasses)
        : classerParMatiereListe(session, baseEleves, matiere);

    const limitees = top === "tous" ? classement : classement.slice(0, Number(top));

    return limitees.map((c) => {
      const eleve = session.eleves[c.matricule];
      return {
        rang: c.rang,
        matricule: c.matricule,
        nom: c.nom,
        prenom: c.prenom,
        classeNom: c.classeNom,
        niveauLisible: eleve ? NOM_NIVEAU[eleve.niveau] : "",
        moyenne: c.moyenne,
        statut: eleve?.statut ?? "",
      };
    });
  }, [session, portee, classeId, niveauFiltre, matiere, top, nomsClasses]);

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

  const libelleMatiere =
    matiere === "general" ? "Moyenne générale" : MATIERES.find((m) => m.key === matiere)?.nom ?? "";
  const libellePortee =
    portee === "generation"
      ? niveauFiltre === "tous"
        ? "Génération entière"
        : NOM_NIVEAU[niveauFiltre as Niveau]
      : nomsClasses[classeId] ?? "Classe";

  const titre = `${top === "tous" ? "Classement" : "Top " + top} — ${libelleMatiere}`;
  const sousTitre = `${libellePortee} · ${session.anneeCourante.libelle} · Édité le ${new Date().toLocaleDateString(
    "fr-FR"
  )}`;
  const nomFichier = slugify(`${titre}-${libellePortee}-${session.anneeCourante.libelle}`);

  return (
    <div className="p-10 max-w-5xl">
      <PageHeader
        eyebrow="Export"
        title="Fiches PDF / Excel"
        description="Composez une fiche filtrée (classe ou génération, matière, nombre d'élèves) puis exportez-la en PDF ou en Excel."
      />

      <div className="border border-line bg-white/60 p-5 mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Périmètre</label>
          <div className="flex border border-line">
            <button
              onClick={() => setPortee("generation")}
              className={`px-3 py-2 text-sm ${
                portee === "generation" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
              }`}
            >
              Génération
            </button>
            <button
              onClick={() => {
                setPortee("classe");
                if (!classeId && session.classes[0]) setClasseId(session.classes[0].id);
              }}
              className={`px-3 py-2 text-sm ${
                portee === "classe" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"
              }`}
            >
              Classe
            </button>
          </div>
        </div>

        {portee === "classe" ? (
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Classe</label>
            <select
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            >
              {session.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Niveau</label>
            <select
              value={niveauFiltre}
              onChange={(e) => setNiveauFiltre(e.target.value)}
              className="border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="tous">Tous les niveaux</option>
              {niveauxDisponibles.map((n) => (
                <option key={n} value={n}>
                  {NOM_NIVEAU[n]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Matière</label>
          <select
            value={matiere}
            onChange={(e) => setMatiere(e.target.value as SubjectKey | "general")}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="general">Moyenne générale</option>
            {MATIERES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Élèves</label>
          <select
            value={top}
            onChange={(e) => setTop(e.target.value)}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {OPTIONS_TOP.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exporterPDF(lignes, titre, sousTitre, nomFichier)}
            disabled={lignes.length === 0}
            className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors disabled:opacity-40"
          >
            Télécharger en PDF
          </button>
          <button
            onClick={() => exporterExcel(lignes, titre, sousTitre, nomFichier)}
            disabled={lignes.length === 0}
            className="border border-ink text-ink px-4 py-2 text-sm hover:bg-paper-dim transition-colors disabled:opacity-40"
          >
            Télécharger en Excel
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="font-display text-lg text-ink">{titre}</div>
        <div className="text-xs text-slate">{sousTitre}</div>
      </div>

      {lignes.length === 0 ? (
        <p className="text-sm text-slate">
          Aucune donnée pour ce périmètre — avancez la timeline depuis le tableau de bord ou
          ajustez les filtres.
        </p>
      ) : (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Niveau</th>
                <th>{libelleMatiere}</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.matricule}>
                  <td className="text-slate">
                    <span className="inline-flex items-center">
                      {l.rang}
                      <RangBadge rang={l.rang} />
                    </span>
                  </td>
                  <td className="font-medium">
                    <Link href={`/eleves/${l.matricule}`} className="hover:text-gold">
                      {l.matricule}
                    </Link>
                  </td>
                  <td>
                    {l.nom} {l.prenom}
                  </td>
                  <td className="text-slate">{l.classeNom}</td>
                  <td className="text-slate">{l.niveauLisible}</td>
                  <td>{l.moyenne.toFixed(2)}</td>
                  <td className="text-slate capitalize">{l.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
