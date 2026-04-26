// Path: apps/web/src/components/admin/admin-stat-card.tsx
type AdminStatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function AdminStatCard({
  label,
  value,
  hint,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>
      <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {value}
      </div>
      {hint && <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{hint}</p>}
    </div>
  );
}