export default function RangBadge({ rang }: { rang: number }) {
  if (!rang || rang > 5) return null;

  if (rang === 1) {
    return (
      <span
        title="1er"
        className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gold text-ink text-[10px] font-bold"
      >
        1
      </span>
    );
  }
  if (rang <= 3) {
    return (
      <span
        title={`${rang}e`}
        className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-gold-soft text-ink text-[10px] font-bold border border-gold"
      >
        {rang}
      </span>
    );
  }
  return (
    <span
      title={`${rang}e — Top 5`}
      className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full border border-gold text-gold text-[10px] font-semibold"
    >
      {rang}
    </span>
  );
}
