"use client";

import { useAcademyStore } from "@/lib/store/useAcademyStore";

export default function FavoriteStar({
  matricule,
  size = "text-base",
}: {
  matricule: string;
  size?: string;
}) {
  const favoris = useAcademyStore((s) => s.session?.favoris ?? []);
  const toggleFavori = useAcademyStore((s) => s.toggleFavori);
  const estFavori = favoris.includes(matricule);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavori(matricule);
      }}
      title={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`${size} leading-none ${
        estFavori ? "text-gold" : "text-line hover:text-gold"
      } transition-colors`}
    >
      {estFavori ? "★" : "☆"}
    </button>
  );
}
