//path: apps/web/src/lib/auth/queries.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import apiClient from "@/lib/apiClient";
import { clearSession, saveSession } from "@/lib/auth/session";
import { sendPhoneVerificationCode, verifyPhoneCode } from "./api";

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  emailVerifiedAt?: string | null;
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  verifyEmailUrl?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

type ForgotPasswordInput = {
  email: string;
};

type ForgotPasswordResponse = {
  ok: true;
  message: string;
  resetToken?: string;
  resetUrl?: string;
};

type ResetPasswordInput = {
  token: string;
  password: string;
};

type ResetPasswordResponse = {
  ok: true;
  message: string;
};

type VerifyEmailInput = {
  token: string;
};

type VerifyEmailResponse = {
  ok: true;
};

type ResendVerificationInput = {
  email: string;
};

type ResendVerificationResponse = {
  ok: true;
  verifyEmailUrl?: string;
};

export function extractAuthErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  const payload = axiosError?.response?.data;

  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }

  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  return "Request failed";
}

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<AuthResponse>("/auth/login", payload);
      return response.data;
    },
    onSuccess: (data) => {
      saveSession(data);
    },
    onError: () => {
      clearSession();
    },
  });
}

export function useRegister() {
  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<AuthResponse>("/auth/register", payload);
      return response.data;
    },
    // onSuccess: (data) => {
    //   saveSession(data);
    // },
    onError: () => {
      clearSession();
    },
  });
}

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordInput>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ForgotPasswordResponse>(
        "/auth/forgot-password",
        payload
      );
      return response.data;
    },
  });
}

export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordInput>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<ResetPasswordResponse>(
        "/auth/reset-password",
        payload
      );
      return response.data;
    },
  });
}

export function useVerifyEmail() {
  return useMutation<VerifyEmailResponse, Error, VerifyEmailInput>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<VerifyEmailResponse>(
        "/auth/verify-email",
        payload
      );
      return response.data;
    },
  });
}

export function useResendVerification() {
  return useMutation<
    ResendVerificationResponse,
    Error,
    ResendVerificationInput
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.post("/auth/resend-verification", payload);
      return res.data;
    },
  });
}
export function useSendPhoneVerificationCode() {
  return useMutation({
    mutationFn: (phone: string) => sendPhoneVerificationCode(phone),
  });
}

export function useVerifyPhoneCode() {
  return useMutation({
    mutationFn: (code: string) => verifyPhoneCode(code),
  });
}