// Path: apps/web/src/components/fixers/FixerFilters.tsx

"use client";

type Props = {
  skill: string;
  state: string;
  city: string;
  minRating: string;

  setSkill: (value: string) => void;
  setState: (value: string) => void;
  setCity: (value: string) => void;
  setMinRating: (value: string) => void;

  onReset?: () => void;
};

const inputClassName =
  "rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20";

export default function FixerFilters({
  skill,
  state,
  city,
  minRating,
  setSkill,
  setState,
  setCity,
  setMinRating,
  onReset,
}: Props) {
  return (
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Search Fixers
          </h2>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Filter by skill, location or minimum rating.
          </p>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
            Skill
          </label>

          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="e.g. Plumber"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
            State
          </label>

          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g. Lagos"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
            City
          </label>

          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Ikeja"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
            Minimum Rating
          </label>

          <input
            inputMode="decimal"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            placeholder="0 - 5"
            className={inputClassName}
          />
        </div>
      </div>
    </section>
  );
}