// Path: apps/web/src/lib/admin/api.ts

import axios from "axios";
import {
  clearAdminSession,
  getAdminToken,
} from "@/lib/admin/session";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Define it in apps/web/.env.local"
  );
}

export const adminApi = axios.create({
  baseURL,
  withCredentials: false,
});

adminApi.defaults.headers.common["Cache-Control"] = "no-cache";

adminApi.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = getAdminToken();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if ("Authorization" in config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message;

    if (
      message === "ADMIN_SESSION_EXPIRED" ||
      message === "ADMIN_INACTIVE" ||
      message === "INVALID_ADMIN_TOKEN" ||
      error?.response?.status === 401
    ) {
      clearAdminSession();

      if (typeof window !== "undefined") {
        window.location.href = "/admin/login?expired=1";
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;