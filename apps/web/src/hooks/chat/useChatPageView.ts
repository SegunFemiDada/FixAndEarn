"use client";

import {
  renderAxiosError,
} from "@/lib/chat/utils";

type Props = {
  isLoading: boolean;

  error: unknown;
};

type Result = {
  isError: boolean;

  showContent: boolean;

  errorMessage: string | null;
};

export function useChatPageView({
  isLoading,
  error,
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
    errorMessage,
  };
}