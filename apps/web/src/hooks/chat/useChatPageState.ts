// Path: apps/web/src/hooks/chat/useChatPageState.ts

"use client";

import {
  useEffect,
  useState,
} from "react";

import { getToken } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";

import type { ChatJob, Negotiation } from "@/lib/chat/types";

import {
  milliToFecInput,
} from "@/lib/chat/utils";

type Params = {
  job: ChatJob | null;
};

export function useChatPageState({
  job,
}: Params) {
  const [
    myUserId,
    setMyUserId,
  ] = useState<
    string | null
  >(null);

  const [
    reportMessageId,
    setReportMessageId,
  ] = useState<
    string | null
  >(null);

  const [
    msg,
    setMsg,
  ] = useState("");

  const [
    proposeFec,
    setProposeFec,
  ] = useState("");

  const [
    lockFec,
    setLockFec,
  ] = useState("");
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);

const setLockedByUser = (userId: string) => {
  setNegotiation((prev) =>
    prev ? { ...prev, lockedByUserId: userId } : prev
  );
};

  useEffect(() => {
    const token =
      getToken();

    if (!token) {
      return;
    }

    setMyUserId(
      decodeJwtUserId(token)
    );
  }, []);

  useEffect(() => {
    if (!job) {
      return;
    }

    const base =
      typeof job.lockedPriceMilliFec ===
      "number"
        ? job.lockedPriceMilliFec
        : typeof job.priceMilliFec ===
            "number"
          ? job.priceMilliFec
          : null;

    if (
      base &&
      !proposeFec
    ) {
      setProposeFec(
        milliToFecInput(base)
      );
    }

    if (
      base &&
      !lockFec
    ) {
      setLockFec(
        milliToFecInput(base)
      );
    }
  }, [
    job,
    lockFec,
    proposeFec,
  ]);

  return {
    myUserId,

    msg,
    setMsg,

    proposeFec,
    setProposeFec,

    lockFec,
    setLockFec,

    reportMessageId,
    setReportMessageId,

    negotiation,
    setNegotiation,
    setLockedByUser,
  };
}