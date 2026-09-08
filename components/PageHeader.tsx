export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-wide text-gold mb-1">{eyebrow}</div>
      )}
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      {description && <p className="text-sm text-slate mt-2 max-w-2xl">{description}</p>}
    </div>
  );
}
