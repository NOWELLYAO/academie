export interface BienLuxe {
  nom: string;
  type: "voiture" | "maison" | "terrain" | "bijoux" | "autre";
  prixMin: number;
  prixMax: number;
}

export const BIENS_LUXE: BienLuxe[] = [
  { nom: "Berline familiale", type: "voiture", prixMin: 3000000, prixMax: 7000000 },
  { nom: "SUV premium", type: "voiture", prixMin: 8000000, prixMax: 18000000 },
  { nom: "Véhicule de luxe importé", type: "voiture", prixMin: 20000000, prixMax: 45000000 },
  { nom: "Appartement en ville", type: "maison", prixMin: 15000000, prixMax: 35000000 },
  { nom: "Villa avec jardin", type: "maison", prixMin: 40000000, prixMax: 90000000 },
  { nom: "Villa de standing en bord de lagune", type: "maison", prixMin: 100000000, prixMax: 250000000 },
  { nom: "Terrain constructible", type: "terrain", prixMin: 5000000, prixMax: 20000000 },
  { nom: "Parcelle agricole", type: "terrain", prixMin: 2000000, prixMax: 8000000 },
  { nom: "Bijoux et montre de collection", type: "bijoux", prixMin: 2000000, prixMax: 12000000 },
];

export function biensAccessibles(budget: number): BienLuxe[] {
  return BIENS_LUXE.filter((b) => b.prixMin <= budget);
}
