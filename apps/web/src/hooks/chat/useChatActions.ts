//path: apps/web/src/hooks/chat/useChatActions.ts
"use client";

import * as React from "react";

import type {
  PendingChatMessage,
} from "@/lib/chat/types";

import {
  lockPrice,
  proposePrice,
  respondLockedPrice,
  sendMessage,
} from "@/lib/chat/api";

import type { AxiosError } from "axios";

type Params = {
  jobId: string;

  fixerId: string;

  myUserId?: string | null;

  refetch: () => Promise<any>;

  addOptimisticMessage: (
    message: PendingChatMessage
  ) => void;

  markFailedMessage: (
    tempId: string
  ) => void;
};

function renderAxiosError(
  err: unknown
): string {
  const e =
    err as AxiosError<{
      message?:
        | string
        | string[];
    }>;

  const msg =
    e.response?.data
      ?.message;

  if (
    Array.isArray(msg)
  ) {
    return msg.join(", ");
  }

  if (msg) {
    return String(msg);
  }

  if (e.message) {
    return e.message;
  }

  return "Unknown error";
}

export function useChatActions({
  jobId,
  fixerId,
  myUserId,
  refetch,
  addOptimisticMessage,
  markFailedMessage,
}: Params) {
  const [actionErr, setActionErr] =
    React.useState<
      string | null
    >(null);

  const [
    sendingMessage,
    setSendingMessage,
  ] = React.useState(false);

  const [
    proposingPrice,
    setProposingPrice,
  ] = React.useState(false);

  const [
    lockingPrice,
    setLockingPrice,
  ] = React.useState(false);

  const [
    respondingToLockedPrice,
    setRespondingToLockedPrice,
  ] = React.useState(false);

  const sendChatMessage =
    React.useCallback(
      async (
        body: string
      ) => {
        const trimmed =
          body.trim();

        if (!trimmed) {
          return;
        }

        const tempId =
          `temp-${Date.now()}`;

        const optimisticMessage: PendingChatMessage =
          {
            id: tempId,
            body: trimmed,
            senderId:
              myUserId ??
              "me",
            createdAt:
              new Date().toISOString(),
            flags: [],
            pending: true,
          };

        try {
          setSendingMessage(
            true
          );

          setActionErr(
            null
          );

          addOptimisticMessage(
            optimisticMessage
          );

          await sendMessage(
            jobId,
            fixerId,
            {
              body: trimmed,
            }
          );

          await refetch();
        } catch (e) {
          markFailedMessage(
            tempId
          );

          setActionErr(
            renderAxiosError(
              e
            )
          );
        } finally {
          setSendingMessage(
            false
          );
        }
      },
      [
        addOptimisticMessage,
        fixerId,
        jobId,
        markFailedMessage,
        myUserId,
        refetch,
      ]
    );

  const submitProposePrice =
    React.useCallback(
      async (
        milli: number
      ) => {
        try {
          setProposingPrice(
            true
          );

          setActionErr(
            null
          );

          await proposePrice(
            jobId,
            fixerId,
            {
              proposedPriceMilliFec:
                milli,
            }
          );

          await refetch();
        } catch (e) {
          setActionErr(
            renderAxiosError(
              e
            )
          );
        } finally {
          setProposingPrice(
            false
          );
        }
      },
      [
        fixerId,
        jobId,
        refetch,
      ]
    );

  const submitLockPrice =
    React.useCallback(
      async (
        milli: number
      ) => {
        try {
          setLockingPrice(
            true
          );

          setActionErr(
            null
          );

          await lockPrice(
            jobId,
            fixerId,
            {
              lockedPriceMilliFec:
                milli,
            }
          );

          await refetch();
        } catch (e) {
          setActionErr(
            renderAxiosError(
              e
            )
          );
        } finally {
          setLockingPrice(
            false
          );
        }
      },
      [
        fixerId,
        jobId,
        refetch,
      ]
    );

  const submitLockedPriceResponse =
    React.useCallback(
      async (
        accept: boolean
      ) => {
        try {
          setRespondingToLockedPrice(
            true
          );

          setActionErr(
            null
          );

          await respondLockedPrice(
            jobId,
            fixerId,
            {
              accept,
            }
          );

          await refetch();
        } catch (e) {
          setActionErr(
            renderAxiosError(
              e
            )
          );
        } finally {
          setRespondingToLockedPrice(
            false
          );
        }
      },
      [
        fixerId,
        jobId,
        refetch,
      ]
    );

  return {
    actionErr,
    setActionErr,

    sendingMessage,
    proposingPrice,
    lockingPrice,
    respondingToLockedPrice,

    sendChatMessage,
    submitProposePrice,
    submitLockPrice,
    submitLockedPriceResponse,
  };
}