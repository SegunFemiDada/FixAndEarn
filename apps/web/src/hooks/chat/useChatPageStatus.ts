// Path: apps/web/src/hooks/chat/useChatPageStatus.ts
"use client";

type Props = {
  jobId: string;

  fixerId: string;

  isLoading: boolean;

  error: unknown;

  showAgreementBootstrap: boolean;
};

export function useChatPageStatus({
  jobId,
  fixerId,
  isLoading,
  error,
  showAgreementBootstrap,
}: Props) {
  const hasInvalidParams =
    !jobId || !fixerId;

  const isError =
    Boolean(error);

  const showStates =
    isLoading ||
    isError ||
    showAgreementBootstrap;

  const showContent =
    !isLoading &&
    !isError;

  return {
    hasInvalidParams,

    showStates,

    showContent,

    isError,
  };
}