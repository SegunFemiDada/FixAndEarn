//path: apps/web/src/lib/apiClient.ts
import axios from "axios";
import {
  clearSession,
  getActiveRole,
  getToken,
} from "@/lib/auth/session";
import { getUserFacingErrorMessage } from "@/lib/shared/user-facing-error";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Define it in apps/web/.env.local"
  );
}

const apiClient = axios.create({
  baseURL,
  withCredentials: false,
});

apiClient.defaults.headers.common["Cache-Control"] =
  "no-cache";

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = getToken();
  const activeRole = getActiveRole();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (activeRole) {
    config.headers["x-active-role"] = activeRole;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message;

    const authHeader =
      error?.config?.headers?.Authorization ??
      error?.config?.headers?.authorization;

    const hadAuthenticatedSession = Boolean(authHeader);

    const isSessionFailure =
      message === "SESSION_EXPIRED" ||
      message === "SESSION_REVOKED";

    if (
      hadAuthenticatedSession &&
      (isSessionFailure || error?.response?.status === 401)
    ) {
      clearSession();

      if (typeof window !== "undefined") {
        window.location.href = "/login?expired=1";
      }
    }
    if (error && typeof error === "object") {
  (error as { message?: string }).message =
    getUserFacingErrorMessage(error);
}

    return Promise.reject(error);
  }
);

export default apiClient;