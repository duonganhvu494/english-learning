const badges = [
  { label: "0", className: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]" },
  { label: "1", className: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" },
  { label: "N5", className: "bg-[var(--color-secondary-soft)] text-[var(--color-secondary)]" },
];

export function StatsBadges() {
  return (
    <div className="flex gap-2 py-4">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className={`flex min-w-22 items-center justify-center rounded-xl px-4 py-3 text-[16px] font-bold ${badge.className}`}
        >
          {badge.label}
        </div>
      ))}
    </div>
  );
}
