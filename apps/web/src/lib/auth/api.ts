// Path: apps/web/src/lib/auth/api.ts
import axios from "axios";
import apiClient from "../apiClient";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  activeRole?: "CLIENT" | "FIXER" | null;
};

export type RegisterRequest = {
  email: string;
  fullName: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

function getApiBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!base) {
    throw new Error(
      "Missing API base URL. Set NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) in apps/web/.env.local"
    );
  }

  return base;
}

const authHttp = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
});

export async function registerUser(input: RegisterRequest): Promise<AuthResponse> {
  const res = await authHttp.post<AuthResponse>("/auth/register", input, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data;
}

export async function loginUser(input: LoginRequest): Promise<AuthResponse> {
  const res = await authHttp.post<AuthResponse>("/auth/login", input, {
    headers: { "Content-Type": "application/json" },
  });

  return res.data;
}
export async function sendPhoneVerificationCode(phone: string) {
  const response = await apiClient.post("/phone-verification/send", { phone });
  return response.data;
}

export async function verifyPhoneCode(code: string) {
  const response = await apiClient.post("/phone-verification/verify", { code });
  return response.data;
}