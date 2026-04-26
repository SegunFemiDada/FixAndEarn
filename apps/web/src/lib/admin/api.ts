// Path: apps/web/src/lib/admin/api.ts
import axios from "axios";
import { getAdminToken } from "@/lib/admin/session";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set. Define it in apps/web/.env.local");
}

export const adminApi = axios.create({
  baseURL,
  withCredentials: false,
});

adminApi.defaults.headers.common["Cache-Control"] = "no-cache";

adminApi.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = getAdminToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && "Authorization" in config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});

export default adminApi;