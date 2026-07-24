// Path: apps/web/src/components/fixers/FixerList.tsx

"use client";

import FixerCard from "@/components/fixers/FixerCard";
import {
  FixerItem,
} from "@/types/fixer";

type Props = {
  fixers: FixerItem[];

  currentUserId?: string | null;

  activeFixerId?: string | null;

  isHiring?: boolean;

  onHire: (fixer: FixerItem) => void;
};

export default function FixerList({
  fixers,
  currentUserId,
  activeFixerId,
  isHiring = false,
  onHire,
}: Props) {
  const filteredFixers = currentUserId
    ? fixers.filter(
        (fixer) =>
          fixer.id !== currentUserId
      )
    : fixers;

  if (filteredFixers.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-[#C5D5EE]
          dark:border-[#2D3F55]
          bg-white
          dark:bg-[#1E2A3A]
          p-5
          text-sm
          text-[#6B7C99]
          dark:text-[#8FA0BC]
          shadow-[0_4px_24px_rgba(91,143,204,0.12)]
          dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
        "
      >
        No approved fixers found for the current filters.
      </div>
    );
  }

  return (
    <div
      className="
        grid
        gap-4
        lg:grid-cols-2
      "
    >
      {filteredFixers.map((fixer) => (
        <FixerCard
          key={fixer.id}
          fixer={fixer}
          busy={
            isHiring &&
            activeFixerId === fixer.id
          }
          onHire={onHire}
        />
      ))}
    </div>
  );
}