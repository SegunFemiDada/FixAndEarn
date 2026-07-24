// Path: apps/web/src/components/fixers/FixerCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  FixerItem,
  availabilityLabel,
  availabilityTone,
  buildImageSrc,
  getEffectiveAvailability,
  ratingValue,
} from "@/types/fixer";

type Props = {
  fixer: FixerItem;

  busy?: boolean;

  onHire: (fixer: FixerItem) => void;
};

export default function FixerCard({
  fixer,
  busy = false,
  onHire,
}: Props) {
  const imageSrc = buildImageSrc(
    fixer.verification?.selfieImagePath ?? null
  );

  const effectiveAvailability =
    getEffectiveAvailability(fixer);

  const isHireable =
    effectiveAvailability === "AVAILABLE";

  return (
    <article
      className="
        rounded-2xl
        border
        border-[#C5D5EE]
        dark:border-[#2D3F55]
        bg-white
        dark:bg-[#1E2A3A]
        p-5
        shadow-[0_4px_24px_rgba(91,143,204,0.12)]
        dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
      "
    >
      <div className="flex gap-4">
        <div
          className="
            relative
            h-20
            w-20
            shrink-0
            overflow-hidden
            rounded-2xl
            border
            border-[#C5D5EE]
            dark:border-[#2D3F55]
            bg-[#EAF0FB]
            dark:bg-[#16202E]
          "
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={fixer.fullName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl">
              👷
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="
                text-lg
                font-semibold
                text-[#1A2B4A]
                dark:text-[#E8F0FA]
              "
            >
              {fixer.fullName}
            </h2>

            <span
              className="
                rounded-full
                border
                border-[#B8D9B8]
                dark:border-green-700
                bg-[#F0FAF0]
                dark:bg-green-900/20
                px-2.5
                py-1
                text-xs
                font-medium
                text-[#2E7D32]
                dark:text-green-200
              "
            >
              Verified
            </span>
          </div>

          <p
            className="
              mt-1
              text-sm
              text-[#6B7C99]
              dark:text-[#8FA0BC]
            "
          >
            {fixer.verification?.city ?? "City"},{" "}
            {fixer.verification?.state ?? "State"}
          </p>

          <div
            className="
              mt-3
              grid
              gap-2
              text-sm
              text-[#1A2B4A]
              dark:text-[#E8F0FA]
              sm:grid-cols-2
            "
          >
            <div>
              <span className="font-medium">
                Skills:
              </span>{" "}
              {fixer.verification?.skills ??
                "Not available"}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-medium">
                Rating:
              </span>

              <span>
                {ratingValue(
                  fixer.averageRating
                )}
              </span>

              <span className="text-[#F5A623]">
                ★
              </span>

              <span
                className="
                  ml-1
                  text-xs
                  text-[#6B7C99]
                  dark:text-[#8FA0BC]
                "
              >
                ({fixer.totalRatings ?? 0} reviews)
              </span>
            </div>

            <div>
              <span className="font-medium">
                Availability:
              </span>{" "}

              <span
                className={`
                  inline-flex
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                  ${availabilityTone(
                    effectiveAvailability
                  )}
                `}
              >
                {availabilityLabel(
                  effectiveAvailability
                )}
              </span>
            </div>

            <div>
              <span className="font-medium">
                LGA:
              </span>{" "}
              {fixer.verification?.lga ??
                "Not available"}
            </div>
          </div>

          <p
            className="
              mt-3
              line-clamp-3
              text-sm
              leading-6
              text-[#6B7C99]
              dark:text-[#8FA0BC]
            "
          >
            {fixer.verification?.bio ??
              "No bio available."}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/app/fixers/${fixer.id}`}
              className="
                inline-flex
                items-center
                justify-center
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-700
                transition-colors
                hover:bg-gray-100
                hover:text-gray-900
                dark:border-gray-700
                dark:bg-gray-800
                dark:text-gray-200
                dark:hover:bg-gray-700
                dark:hover:text-gray-100
              "
            >
              View profile
            </Link>

            <button
              type="button"
              onClick={() => onHire(fixer)}
              disabled={
                busy ||
                !isHireable
              }
              className={`
                inline-flex
                items-center
                justify-center
                rounded-lg
                px-4
                py-2.5
                text-sm
                font-semibold
                transition-colors
                duration-200
                ${
                  busy || !isHireable
                    ? `
                      cursor-not-allowed
                      border
                      border-gray-300
                      bg-gray-100
                      text-gray-400
                      opacity-60
                      dark:border-gray-700
                      dark:bg-gray-800
                      dark:text-gray-500
                    `
                    : `
                      bg-blue-600
                      text-white
                      shadow-md
                      hover:bg-blue-700
                      hover:shadow-lg
                      focus:ring-2
                      focus:ring-blue-400
                      dark:bg-blue-500
                      dark:hover:bg-blue-600
                      dark:focus:ring-blue-300
                    `
                }
              `}
            >
              {busy
                ? "Processing..."
                : !isHireable
                ? `Currently ${availabilityLabel(
                    effectiveAvailability
                  )}`
                : "Hire now"}
            </button>

            <span
              className="
                text-xs
                text-[#6B7C99]
                dark:text-[#8FA0BC]
              "
            >
              Secure payment required
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}