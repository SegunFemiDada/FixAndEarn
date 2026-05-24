// Path: apps/web/src/components/chats/ChatNegotiationSection.tsx
"use client";

import NegotiationPanel from "@/components/chats/NegotiationPanel";

import type {
  Negotiation,
} from "@/lib/chat/types";

type Props = {
  negotiation:
    | Negotiation
    | null;

  proposeFec: string;

  lockFec: string;

  proposingPrice: boolean;

  lockingPrice: boolean;

  respondingToLockedPrice: boolean;

  onChangeProposeFec: (
    value: string
  ) => void;

  onChangeLockFec: (
    value: string
  ) => void;

  onPropose: (
    milli: number
  ) => void | Promise<void>;

  onLock: (
    milli: number
  ) => void | Promise<void>;

  onRespond: (
    accept: boolean
  ) => void | Promise<void>;
};

export default function ChatNegotiationSection({
  negotiation,
  proposeFec,
  lockFec,
  proposingPrice,
  lockingPrice,
  respondingToLockedPrice,
  onChangeProposeFec,
  onChangeLockFec,
  onPropose,
  onLock,
  onRespond,
}: Props) {
  return (
    <NegotiationPanel
      negotiation={
        negotiation
      }
      proposeFec={
        proposeFec
      }
      lockFec={
        lockFec
      }
      proposingPrice={
        proposingPrice
      }
      lockingPrice={
        lockingPrice
      }
      respondingToLockedPrice={
        respondingToLockedPrice
      }
      onChangeProposeFec={
        onChangeProposeFec
      }
      onChangeLockFec={
        onChangeLockFec
      }
      onPropose={
        onPropose
      }
      onLock={
        onLock
      }
      onRespond={
        onRespond
      }
    />
  );
}