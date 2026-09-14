"use client";

import { useAcademyStore } from "@/lib/store/useAcademyStore";

const PALETTE = [
  "#101B33", // ink
  "#1F5C4B", // forest
  "#7A2E3B", // burgundy
  "#A9821A", // gold foncé (meilleur contraste que --gold en fond plein)
  "#2E5C7A", // bleu ardoise
  "#6B4226", // brun
  "#4B5C2E", // olive
  "#5C2E7A", // prune
  "#2E7A6B", // sarcelle
  "#7A4B2E", // ocre
  "#3D3D5C", // indigo
  "#7A5C2E", // bronze
];

function hashChaine(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function Avatar({
  matricule,
  nom,
  prenom,
  size = 36,
  favori,
}: {
  matricule: string;
  nom: string;
  prenom: string;
  size?: number;
  /** Optionnel — si non fourni, se détermine automatiquement depuis les
   * favoris de la session, pour que l'étiquette apparaisse partout dans
   * l'application sans avoir à la câbler manuellement à chaque endroit. */
  favori?: boolean;
}) {
  const favorisSession = useAcademyStore((s) => s.session?.favoris ?? []);
  const estFavori = favori ?? favorisSession.includes(matricule);
  const couleur = PALETTE[hashChaine(matricule) % PALETTE.length];
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  return (
    <div className="relative inline-flex shrink-0" title={estFavori ? `${prenom} ${nom} — ★ favori` : `${prenom} ${nom}`}>
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: couleur,
          fontSize: size * 0.4,
          boxShadow: estFavori ? "0 0 0 2px #C9A227" : undefined,
        }}
        className="rounded-full flex items-center justify-center text-paper font-display shrink-0 select-none"
      >
        {initiales}
      </div>
      {estFavori && (
        <span
          style={{ fontSize: Math.max(9, size * 0.32) }}
          className="absolute -top-1 -right-1 leading-none text-gold bg-paper rounded-full"
        >
          ★
        </span>
      )}
    </div>
  );
}
