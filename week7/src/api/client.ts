/* src/api/client.ts */
import axios, { AxiosError } from "axios";
import { tokenStore } from "../hooks/useTokenStore";

type ApiInstance = ReturnType<typeof axios.create>;

const api: ApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/v1",
  withCredentials: false, // 헤더 토큰만 쓴다면 false 권장 (쿠키 인증이면 true)
});

// 401 처리 중 중복 리디렉션 방지
let isRedirecting401 = false;

api.interceptors.request.use((config) => {
  // ① Zustand(store) → ② localStorage → ③ sessionStorage
  let token: string | null = null;

  try {
    const getState = (tokenStore as any)?.getState;
    const stateToken = typeof getState === "function" ? getState()?.accessToken : undefined;
    if (stateToken) token = stateToken;
  } catch {}

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    // 호환 키들 체크 (혹시 다른 키로 저장했을 가능성)
    if (!token) {
      token =
        localStorage.getItem("token") ||
        localStorage.getItem("Authorization") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("Authorization");
    }
  }

  // 헤더가 이미 존재하면 유지하고, 없으면 추가
  config.headers = config.headers ?? {};
  if (token && !config.headers.Authorization) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const urlShown = `${config.baseURL ?? ""}${config.url ?? ""}`;
  const tokenPreview = token ? `${token.slice(0, 12)}…(${token.length})` : "null";
  console.log("[REQ]", (config.method ?? "get").toUpperCase(), urlShown, "| Authorization:", !!token, tokenPreview);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;
    const url = (err.config?.url ?? "").toString();

    // 인증 관련 요청(토큰 재발급/로그아웃/내정보/로그인 등)만 자동 로그아웃
    // 예: /v1/auth/refresh, /v1/auth/reissue, /v1/auth/me, /v1/auth/logout, /v1/auth/signout, /v1/auth/signin(401)
    const isAuthRequest = /\/auth\/(refresh|reissue|me|logout|signout|signin)(\/|\?|$)/.test(url);

    if (status === 401 && isAuthRequest) {
      console.warn("[401 Unauthorized - auth scope]", url);

      // 1) 전역 상태(Zustand) 초기화
      try {
        const setState = (tokenStore as any)?.setState;
        if (typeof setState === "function") {
          setState({ accessToken: null, isLoggedIn: false });
        }
      } catch {}

      // 2) 스토리지 토큰 제거
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("Authorization");
          localStorage.removeItem("token");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("Authorization");
          sessionStorage.removeItem("token");
        } catch {}
      }

      // 3) Axios 인스턴스의 Authorization 헤더 제거
      try {
        if ((api as any)?.defaults?.headers?.common?.Authorization) {
          delete (api as any).defaults.headers.common.Authorization;
        }
        if (err.config?.headers && (err.config.headers as any).Authorization) {
          delete (err.config.headers as any).Authorization;
        }
      } catch {}

      // 4) 중복 리디렉션 방지 후 로그인 페이지로 이동
      if (!isRedirecting401) {
        isRedirecting401 = true;
        try {
          console.info("인증이 만료되었어요. 다시 로그인해 주세요.");
          if (typeof window !== "undefined") {
            window.location.replace("/login");
          }
        } catch {}
      }
    } else if (status === 401) {
      // 인증 영역이 아닌 401은 자동 로그아웃/리디렉션 하지 않고, 화면에서 처리하도록 넘김
      console.warn("[401 Unauthorized - non-auth scope]", url);
    }

    try {
      const apiUrl = (err.config?.url as string) || "";
      const data = err.response?.data;
      console.warn("[HTTP ERROR]", status, apiUrl, data);
    } catch {}

    return Promise.reject(err);
  }
);

export default api;
