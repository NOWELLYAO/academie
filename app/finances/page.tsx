"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAcademyStore } from "@/lib/store/useAcademyStore";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Avatar from "@/components/Avatar";
import RangBadge from "@/components/RangBadge";
import { formaterFCFA, SEUIL_BOURSE_MERITE } from "@/lib/engines/finances";

export default function FinancesPage() {
  const session = useAcademyStore((s) => s.session);
  const [portee, setPortee] = useState<"generation" | "classe">("generation");
  const [classeId, setClasseId] = useState("");
  const [boursiersUniquement, setBoursiersUniquement] = useState(false);

  const nomsClasses = useMemo(() => {
    if (!session) return {} as Record<string, string>;
    const carte: Record<string, string> = {};
    session.classes.forEach((c) => (carte[c.id] = c.nom));
    return carte;
  }, [session]);

  const classement = useMemo(() => {
    if (!session) return [];
    let eleves = Object.values(session.eleves);
    if (portee === "classe") {
      const classe = session.classes.find((c) => c.id === classeId);
      eleves = classe ? classe.matricules.map((m) => session.eleves[m]).filter(Boolean) : [];
    }
    if (boursiersUniquement) eleves = eleves.filter((e) => e.boursier);

    return [...eleves]
      .sort((a, b) => (b.solde ?? 0) - (a.solde ?? 0))
      .map((e, i) => ({ eleve: e, rang: i + 1 }));
  }, [session, portee, classeId, boursiersUniquement]);

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

  const tousEleves = Object.values(session.eleves);
  const totalDistribue = tousEleves.reduce((acc, e) => acc + (e.solde ?? 0), 0);
  const nbBoursiers = tousEleves.filter((e) => e.boursier).length;
  const soldeMoyen = tousEleves.length ? totalDistribue / tousEleves.length : 0;
  const meilleurSolde = classement[0]?.eleve;

  return (
    <div className="p-5 md:p-10 max-w-4xl">
      <PageHeader
        eyebrow="💰 Bourses & récompenses"
        title="Finances des élèves"
        description="Chaque mention, badge, concours gagné ou admission d'excellence rapporte une récompense financière. Boursiers dès 14/20 de moyenne annuelle."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total distribué" value={formaterFCFA(totalDistribue)} accent="gold" />
        <StatCard label="Boursiers" value={nbBoursiers} accent="forest" sub={`Seuil : ${SEUIL_BOURSE_MERITE}/20`} />
        <StatCard label="Solde moyen" value={formaterFCFA(soldeMoyen)} />
        <StatCard
          label="Plus gros pécule"
          value={meilleurSolde ? formaterFCFA(meilleurSolde.solde ?? 0) : "—"}
          sub={meilleurSolde ? `${meilleurSolde.nom} ${meilleurSolde.prenom}` : ""}
          accent="gold"
        />
      </div>

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex border border-line bg-white/60">
          <button
            onClick={() => setPortee("generation")}
            className={`px-4 py-2 text-sm ${portee === "generation" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Génération
          </button>
          <button
            onClick={() => {
              setPortee("classe");
              if (!classeId && session.classes[0]) setClasseId(session.classes[0].id);
            }}
            className={`px-4 py-2 text-sm ${portee === "classe" ? "bg-ink text-paper" : "text-slate hover:bg-paper-dim"}`}
          >
            Par classe
          </button>
        </div>

        {portee === "classe" && (
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
        )}

        <label className="flex items-center gap-2 text-sm text-slate cursor-pointer">
          <input
            type="checkbox"
            checked={boursiersUniquement}
            onChange={(e) => setBoursiersUniquement(e.target.checked)}
          />
          Boursiers uniquement
        </label>
      </div>

      <div className="border border-line bg-white/60 overflow-x-auto scrollbar-thin">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th></th>
              <th>Matricule</th>
              <th>Élève</th>
              <th>Classe</th>
              <th>Statut</th>
              <th>Solde disponible</th>
            </tr>
          </thead>
          <tbody>
            {classement.slice(0, 100).map(({ eleve: e, rang }) => (
              <tr key={e.matricule}>
                <td className="text-slate">
                  <span className="inline-flex items-center">
                    {rang}
                    <RangBadge rang={rang} />
                  </span>
                </td>
                <td>
                  <Avatar matricule={e.matricule} nom={e.nom} prenom={e.prenom} size={26} />
                </td>
                <td className="font-medium">
                  <Link href={`/eleves/${e.matricule}`} className="hover:text-gold">
                    {e.matricule}
                  </Link>
                </td>
                <td>
                  {e.nom} {e.prenom}
                </td>
                <td className="text-slate">{nomsClasses[e.classeId] ?? e.classeId}</td>
                <td>
                  {e.boursier ? (
                    <span className="text-xs border border-gold text-ink px-2 py-0.5 bg-gold-soft/40">
                      🎓 Boursier
                    </span>
                  ) : (
                    <span className="text-slate text-xs">—</span>
                  )}
                </td>
                <td className="font-medium tabular-nums">{formaterFCFA(e.solde ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
