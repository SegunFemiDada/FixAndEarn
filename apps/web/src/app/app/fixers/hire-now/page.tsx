// Path: apps/web/src/app/app/fixers/hire-now/page.tsx

"use client";

import { useEffect, useState } from "react";

import {
  useDiscoverFixers,
} from "@/lib/users/queries";

import {
  getToken,
} from "@/lib/auth/session";

import {
  decodeJwtUserId,
} from "@/lib/auth/jwt";

import useHireNowFilters from "@/hooks/useHireNowFilters";

import FixerFilters from "@/components/fixers/FixerFilters";
import FixerList from "@/components/fixers/FixerList";
import UrgentHireModal from "@/components/jobs/UrgentHireModal";

import {
  FixerItem,
  extractErrorMessage,
} from "@/types/fixer";


export default function HireNowPage() {
  const {
    skill,
    state,
    city,
    minRating,

    setSkill,
    setState,
    setCity,
    setMinRating,

    resetFilters,

    queryParams,
  } = useHireNowFilters();


  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(null);


  const [
    selectedFixer,
    setSelectedFixer,
  ] = useState<FixerItem | null>(null);


  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);



  useEffect(() => {
    const token = getToken();

    if (token) {
      setCurrentUserId(
        decodeJwtUserId(token)
      );
    }
  }, []);


  const {
    data,
    isLoading,
    isError,
    error,
  } = useDiscoverFixers(
    queryParams,
    true
  );


  const fixers =
    (data ?? []) as FixerItem[];


  function openHireModal(
    fixer: FixerItem
  ) {
    setSelectedFixer(fixer);
    setModalOpen(true);
  }


  function closeHireModal() {
    setModalOpen(false);
    setSelectedFixer(null);
  }


  const listErrorMessage =
    extractErrorMessage(
      error,
      "Unable to load fixers."
    );


  return (
    <div
      className="
        min-h-screen
        bg-linear-to-br
        from-[#C8DCF0]
        to-[#D6E4F7]
        dark:bg-none
        dark:bg-[#111827]
        px-4
        py-6
      "
    >
      <div
        className="
          mx-auto
          max-w-5xl
          space-y-6
        "
      >

        <section
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
            sm:p-6
          "
        >
          <p
            className="
              text-xs
              font-bold
              uppercase
              tracking-[0.2em]
              text-[#5B8FCC]
              dark:text-[#7AAEE0]
            "
          >
            Urgent hiring
          </p>

          <h1
            className="
              mt-2
              text-2xl
              font-semibold
              text-[#1A2B4A]
              dark:text-[#E8F0FA]
            "
          >
            Hire a fixer now
          </h1>

          <p
            className="
              mt-3
              max-w-3xl
              text-sm
              leading-6
              text-[#6B7C99]
              dark:text-[#8FA0BC]
            "
          >
            Browse verified fixers by skill,
            location, and rating. Select a
            fixer to start urgent hiring.
            Payment is completed securely
            before assignment.
          </p>
        </section>


        <FixerFilters
          skill={skill}
          state={state}
          city={city}
          minRating={minRating}

          setSkill={setSkill}
          setState={setState}
          setCity={setCity}
          setMinRating={setMinRating}

          onReset={resetFilters}
        />


        {isLoading ? (
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
            "
          >
            Loading fixers...
          </div>
        ) : isError ? (
          <div
            className="
              rounded-2xl
              border
              border-[#F2C0BC]
              bg-[#FFF4F3]
              p-5
              text-sm
              text-[#D9534F]
              dark:border-red-700
              dark:bg-red-900/20
              dark:text-red-300
            "
          >
            {listErrorMessage}
          </div>
        ) : (
          <FixerList
            fixers={fixers}
            currentUserId={currentUserId}
            onHire={openHireModal}
          />
        )}


        <UrgentHireModal
          fixer={selectedFixer}
          open={modalOpen}
          onClose={closeHireModal}
        />

      </div>
    </div>
  );
}