// lib/utils/api-client.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { API_ROUTES } from "@/lib/constants/api-routes";

const api = axios.create({
  baseURL: "", // process.env.NEXT_PUBLIC_API_URL (nếu có)
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    // Token is automatically sent via cookie (withCredentials: true)
    // No need to add Authorization header manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Gửi request và **chỉ** trả `payload` (data) khi backend trả `success: true`.
 * Nếu backend trả `success: false` (lỗi nghiệp vụ) **hoặc** gặp lỗi hệ thống (network/5xx):
 *   • Hiển thị `window.alert` (trừ auth endpoints)
 *   • Ném lỗi để caller tự `try/catch` khi cần
 */
export async function callApi<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  data?: any,
  config?: (AxiosRequestConfig & { silent?: boolean }) & { _retry?: boolean }
): Promise<T> {
  console.log(`🔥 API Call: ${method} ${url}`, data);

  try {
    const res = await api.request({
      url,
      method,
      ...(method === "GET" ? { params: data } : { data }),
      ...config,
    });

    console.log(`✅ API Response: ${method} ${url}`, res.data);

    // Backend chuẩn hóa { success, message, data }
    const { success, message, data: payload } = res.data;

    // Only skip alerts for silent requests, not auth endpoints
    // Auth endpoints should show errors to users
    const shouldShowAlert = !config?.silent;

    if (!success) {
      if (shouldShowAlert) {
        alert(message);
      }
      // For silent requests, don't log errors
      if (!config?.silent) {
        console.error(`❌ API Error: ${method} ${url}`, new Error(message));
      }
      throw new Error(message); // Always throw error for failed API calls
    }

    return payload as T;

    /* ---------- LỖI NGHIỆP VỤ (HTTP 200, success=false) ---------- */
  } catch (err) {
    /* ---------- LỖI HỆ THỐNG (network, 5xx, timeout, JSON sai) ---------- */
    const axiosErr = err as AxiosError;
    const msg = (axiosErr.response?.data as any)?.message || axiosErr.message || "Internal Server Error";

    // Handle 401 Unauthorized - Token expired or invalid
    if (axiosErr.response?.status === 401) {
      // Avoid infinite loop and skip for auth endpoints themselves
      const isAuthEndpoint = url.includes("/auth/");
      const alreadyRetried = !!config?._retry;

      if (!alreadyRetried && !url.includes("/auth/refresh")) {
        try {
          // Try silent refresh using raw axios to avoid recursion
          const refreshRes = await api.post(API_ROUTES.AUTH.REFRESH, undefined, { withCredentials: true });
          const { success } = refreshRes.data || {};
          if (success) {
            // Retry original request once
            const retryRes = await api.request({
              url,
              method,
              ...(method === "GET" ? { params: data } : { data }),
              ...(config || {}),
              withCredentials: true,
              headers: { ...(config?.headers || {}), "Content-Type": config?.headers?.["Content-Type"] || "application/json" },
            });
            const { success: ok, data: payload, message } = retryRes.data || {};
            if (!ok) throw new Error(message || "Request failed");
            return payload as T;
          }
        } catch (refreshErr) {
          // fallthrough to redirect
        }
      }

      // Get current locale from URL
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const pathSegments = currentPath.split("/").filter(Boolean);
      const currentLocale = ["vi", "en"].includes(pathSegments[0] as any) ? pathSegments[0] : "vi";

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("user");
        } catch {}
        window.location.href = `/${currentLocale}/login`;
      }
      throw new Error("Session expired. Please login again.");
    }

    // For silent requests, don't log system errors either
    if (!config?.silent) {
      console.error(`❌ API Error: ${method} ${url}`, err);
      console.error("Error response:", axiosErr.response?.data);
      console.error("Error status:", axiosErr.response?.status);
    }

    throw new Error(msg);
  }
}
