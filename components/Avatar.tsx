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
  favori = false,
}: {
  matricule: string;
  nom: string;
  prenom: string;
  size?: number;
  favori?: boolean;
}) {
  const couleur = PALETTE[hashChaine(matricule) % PALETTE.length];
  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

  return (
    <div
      title={`${prenom} ${nom}`}
      style={{
        width: size,
        height: size,
        backgroundColor: couleur,
        fontSize: size * 0.4,
        boxShadow: favori ? "0 0 0 2px #C9A227" : undefined,
      }}
      className="rounded-full flex items-center justify-center text-paper font-display shrink-0 select-none"
    >
      {initiales}
    </div>
  );
}
