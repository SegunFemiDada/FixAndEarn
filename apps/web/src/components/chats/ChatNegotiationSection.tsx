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

  onPropose: () => void | Promise<void>;

  onLock: () => void | Promise<void>;

  onRespond: (
    accept: boolean
  ) => void | Promise<void>;
  myUserId: string | null;
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
  myUserId
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
      myUserId={myUserId}
    />
  );
}