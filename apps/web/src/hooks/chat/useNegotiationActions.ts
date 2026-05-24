// Path: apps/web/src/hooks/chat/useNegotiationActions.ts

"use client";

import { useState } from "react";

export function useNegotiationActions() {
  const [proposingPrice, setProposingPrice] =
    useState(false);

  const [lockingPrice, setLockingPrice] =
    useState(false);

  const [respondingToLockedPrice, setRespondingToLockedPrice] =
    useState(false);

  return {
    proposingPrice,
    setProposingPrice,

    lockingPrice,
    setLockingPrice,

    respondingToLockedPrice,
    setRespondingToLockedPrice,
  };
}