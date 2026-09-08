export default function StatCard({
  label,
  value,
  accent = "ink",
  sub,
}: {
  label: string;
  value: string | number;
  accent?: "ink" | "gold" | "forest" | "burgundy";
  sub?: string;
}) {
  const accentColor = {
    ink: "text-ink",
    gold: "text-gold",
    forest: "text-forest",
    burgundy: "text-burgundy",
  }[accent];

  return (
    <div className="border border-line bg-white/60 px-5 py-4">
      <div className="text-[11px] uppercase tracking-wide text-slate">{label}</div>
      <div className={`font-display text-3xl mt-1 ${accentColor}`}>{value}</div>
      {sub && <div className="text-xs text-slate mt-1">{sub}</div>}
    </div>
  );
}
