/* src/api/client.ts */
import axios, { AxiosError } from "axios";
import { tokenStore } from "../hooks/useTokenStore";

// ✅ AxiosInstance 타입 대신 ReturnType<typeof axios.create> 사용
type ApiInstance = ReturnType<typeof axios.create>;

const api: ApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/v1",
  withCredentials: true,
});

// ✅ 요청 인터셉터
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  config.headers = config.headers ?? {};
  if (token) config.headers.Authorization = `Bearer ${token}`;

  console.log("[REQ]", config.method?.toUpperCase(), config.baseURL + (config.url ?? ""));
  return config;
});

// ✅ 응답 인터셉터 (401에서도 토큰 삭제/리다이렉트 X)
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      console.warn("[401 Unauthorized]", err.config?.url);
    }
    return Promise.reject(err);
  }
);

export default api;
