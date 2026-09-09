"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import { MATIERES } from "@/lib/data/subjects";
import { Note, SubjectKey } from "@/lib/models/types";

const TYPES: { value: Note["type"]; label: string }[] = [
  { value: "devoir", label: "Devoir" },
  { value: "interrogation", label: "Interrogation" },
  { value: "controle", label: "Contrôle" },
  { value: "examen", label: "Examen" },
  { value: "projet", label: "Projet" },
  { value: "tp", label: "TP" },
  { value: "surprise", label: "Évaluation surprise" },
];

export default function NotesSaisiePage({
  params,
}: {
  params: Promise<{ classId: string; matiereId: string }>;
}) {
  const { classId, matiereId } = use(params);
  const matiere = matiereId as SubjectKey;
  const session = useAcademyStore((s) => s.session);
  const creerEvaluationManuelle = useAcademyStore((s) => s.creerEvaluationManuelle);
  const enregistrerNote = useAcademyStore((s) => s.enregistrerNote);
  const genererNotesAleatoiresEvaluation = useAcademyStore((s) => s.genererNotesAleatoiresEvaluation);

  const [type, setType] = useState<Note["type"]>("devoir");
  const [bareme, setBareme] = useState<10 | 20>(20);
  const [coefficient, setCoefficient] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  if (!session) return null;
  const classe = session.classes.find((c) => c.id === classId);
  const matiereInfo = MATIERES.find((m) => m.key === matiere);
  if (!classe || !matiereInfo) {
    return (
      <div className="p-5 md:p-10">
        <p className="text-slate text-sm">Classe ou matière introuvable.</p>
      </div>
    );
  }

  const eleves = classe.matricules.map((m) => session.eleves[m]).filter(Boolean);
  const evaluationsExistantes = session.evaluations.filter(
    (ev) => ev.classeId === classId && ev.matiere === matiere
  );
  const evaluationActive =
    evaluationsExistantes.find((e) => e.id === evaluationId) ??
    (evaluationId === null ? null : undefined);

  function creer() {
    const id = creerEvaluationManuelle(classId, matiere, type, bareme, coefficient);
    setEvaluationId(id);
  }

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <Link href="/notes" className="text-xs text-slate hover:text-ink mb-4 inline-block">
        ← Choisir une autre classe/matière
      </Link>
      <PageHeader
        eyebrow={`${classe.nom} · ${matiereInfo.nom}`}
        title="Gérer les notes"
        description={`Trimestre ${session.anneeCourante.trimestreCourant} — ${session.anneeCourante.libelle}`}
      />

      <div className="border border-line bg-white/60 p-5 mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Note["type"])}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Barème</label>
          <select
            value={bareme}
            onChange={(e) => setBareme(Number(e.target.value) as 10 | 20)}
            className="border border-line bg-white px-3 py-2 text-sm"
          >
            <option value={20}>/20</option>
            <option value={10}>/10</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">Coefficient</label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={coefficient}
            onChange={(e) => setCoefficient(Number(e.target.value))}
            className="border border-line bg-white px-3 py-2 text-sm w-20"
          />
        </div>
        <button
          onClick={creer}
          className="bg-ink text-paper px-4 py-2 text-sm hover:bg-ink-soft transition-colors"
        >
          Créer l&apos;évaluation
        </button>

        {evaluationsExistantes.length > 0 && (
          <div>
            <label className="block text-[11px] uppercase tracking-wide text-slate mb-1">
              Évaluations existantes
            </label>
            <select
              value={evaluationId ?? ""}
              onChange={(e) => setEvaluationId(e.target.value || null)}
              className="border border-line bg-white px-3 py-2 text-sm"
            >
              <option value="">— sélectionner —</option>
              {evaluationsExistantes.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.type} · T{ev.trimestre} · /{ev.bareme}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {evaluationActive && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate">
            {Object.keys(evaluationActive.saisies).length} / {eleves.length} notes saisies
          </p>
          <button
            onClick={() => genererNotesAleatoiresEvaluation(evaluationActive.id)}
            className="text-xs border border-ink text-ink px-3 py-1.5 hover:bg-paper-dim transition-colors"
            title="Génère une note pour chaque élève, cohérente avec son niveau habituel dans la matière"
          >
            🎲 Générer aléatoirement les notes
          </button>
        </div>
      )}

      {evaluationActive && (
        <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Note / {evaluationActive.bareme}</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map((e) => (
                <tr key={e.matricule}>
                  <td className="font-medium">{e.matricule}</td>
                  <td>
                    {e.nom} {e.prenom}
                  </td>
                  <td>
                    <input
                      key={`${evaluationActive.id}-${e.matricule}-${evaluationActive.saisies[e.matricule] ?? "vide"}`}
                      type="number"
                      min={0}
                      max={evaluationActive.bareme}
                      step={0.5}
                      defaultValue={evaluationActive.saisies[e.matricule] ?? ""}
                      onBlur={(ev) => {
                        const v = Number(ev.target.value);
                        if (!Number.isNaN(v)) enregistrerNote(evaluationActive.id, e.matricule, v);
                      }}
                      className="w-20 border border-line bg-white px-2 py-1 text-sm focus:outline-none focus:border-ink"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
