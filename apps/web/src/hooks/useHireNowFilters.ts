// Path: apps/web/src/hooks/useHireNowFilters.ts

"use client";

import { useMemo, useState } from "react";

export type HireNowQueryParams = {
  skill?: string;
  state?: string;
  city?: string;
  minRating?: number;
  take: number;
  skip: number;
};

export default function useHireNowFilters() {
  const [skill, setSkill] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");

  const queryParams = useMemo<HireNowQueryParams>(() => {
    const parsedRating =
      minRating.trim() !== "" &&
      Number.isFinite(Number(minRating))
        ? Number(minRating)
        : undefined;

    return {
      skill: skill.trim() || undefined,
      state: state.trim() || undefined,
      city: city.trim() || undefined,
      minRating: parsedRating,
      take: 20,
      skip: 0,
    };
  }, [
    skill,
    state,
    city,
    minRating,
  ]);

  function resetFilters() {
    setSkill("");
    setState("");
    setCity("");
    setMinRating("");
  }

  const hasActiveFilters =
    skill.trim() !== "" ||
    state.trim() !== "" ||
    city.trim() !== "" ||
    minRating.trim() !== "";

  return {
    skill,
    state,
    city,
    minRating,

    setSkill,
    setState,
    setCity,
    setMinRating,

    resetFilters,
    hasActiveFilters,

    queryParams,
  };
}