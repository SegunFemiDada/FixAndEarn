// Path: apps/web/src/components/chats/AgreementBootstrapCard.tsx

"use client";

import {Button} from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Props = {
  isConversationMissing: boolean;
  agreementBusy: boolean;
  onAccept: () => void;
};

export default function AgreementBootstrapCard({
  isConversationMissing,
  agreementBusy,
  onAccept,
}: Props) {
  return (
    <Card className="space-y-3">
      <div className="font-semibold">
        {isConversationMissing
          ? "No conversation yet"
          : "Agreement required"}
      </div>

      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        {isConversationMissing
          ? "Conversation starts after agreement acceptance or first message."
          : "You must accept agreement before chatting."}
      </div>

      <Button
        disabled={agreementBusy}
        onClick={onAccept}
        variant="primary"
      >
        {agreementBusy
          ? "Submitting..."
          : "Accept agreement"}
      </Button>
    </Card>
  );
}