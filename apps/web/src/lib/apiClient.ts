// Path: apps/web/src/lib/apiClient.ts
import axios from "axios";
import { getActiveRole, getToken } from "@/lib/auth/session";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set. Define it in apps/web/.env.local");
}

const apiClient = axios.create({
  baseURL,
  withCredentials: false,
});

apiClient.defaults.headers.common["Cache-Control"] = "no-cache";

apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = getToken();
  const activeRole = getActiveRole();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if ("Authorization" in config.headers) {
    delete config.headers.Authorization;
  }

  if (activeRole) {
    config.headers["x-active-role"] = activeRole;
  } else if ("x-active-role" in config.headers) {
    delete config.headers["x-active-role"];
  }

  return config;
});

export default apiClient;