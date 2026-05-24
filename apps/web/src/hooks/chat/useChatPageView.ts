// Path: apps/web/src/hooks/chat/useChatPageView.ts
"use client";

import {
  renderAxiosError,
} from "@/lib/chat/utils";

type Props = {
  isLoading: boolean;

  error: unknown;

  showAgreementBootstrap: boolean;
};

type Result = {
  isError: boolean;

  showContent: boolean;

  showAgreementBootstrap: boolean;

  errorMessage: string | null;
};

export function useChatPageView({
  isLoading,
  error,
  showAgreementBootstrap,
}: Props): Result {
  const isError =
    Boolean(error);

  const showContent =
    !isLoading &&
    !isError;

  const errorMessage =
    isError
      ? renderAxiosError(
          error
        )
      : null;

  return {
    isError,

    showContent,

    showAgreementBootstrap,

    errorMessage,
  };
}