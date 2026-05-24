// Path: apps/web/src/components/chats/ChatNegotiationSectionContainer.tsx
"use client";

import ChatNegotiationSection from "@/components/chats/ChatNegotiationSection";

import type {
  NegotiationSectionProps,
} from "@/components/chats/ChatPageContent";

export default function ChatNegotiationSectionContainer({
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
}: NegotiationSectionProps) {
  return (
    <ChatNegotiationSection
      negotiation={
        negotiation
      }
      proposeFec={
        proposeFec
      }
      lockFec={lockFec}
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
      onLock={onLock}
      onRespond={
        onRespond
      }
    />
  );
}