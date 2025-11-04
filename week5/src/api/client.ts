import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { tokenStore } from "../hooks/useTokenStore";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/v1",
  withCredentials: true, // 🔑 Refresh 쿠키 사용 시 필수
});

// 요청 인터셉터: 매 요청에 AccessToken 부착
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----- 응답 인터셉터(토큰 재발급 로직) -----
let isRefreshing = false;
let subscribers: ((token: string) => void)[] = [];

// 새 토큰을 기다리는 요청들을 깨우기
function onRefreshed(newToken: string) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}

// 새 토큰 나오기 전까지 대기열 등록
function addSubscriber(cb: (token: string) => void) {
  subscribers.push(cb);
}

// 실제 Refresh 요청
async function refreshAccessToken(): Promise<string> {
  // 서버가 쿠키 기반으로 refresh 한다고 가정
  const { data } = await axios.post(
    (import.meta.env.VITE_API_URL ?? "http://localhost:8000/v1") + "/auth/refresh",
    {},
    { withCredentials: true }
  );
  // 응답에서 새 access token 받았다고 가정
  const newToken: string = data?.accessToken;
  if (!newToken) throw new Error("No accessToken in refresh response");
  tokenStore.set(newToken);
  return newToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    // 401이 아니면 그대로 실패
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }
    // 이미 재시도한 요청이면 무한루프 방지
    if (original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    // 1) 누군가 이미 refresh 중이면, 끝나고 나서 재시도만 한다
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addSubscriber((newToken) => {
          if (!original.headers) original.headers = {};
          original.headers.Authorization = `Bearer ${newToken}`;
          api.request(original).then(resolve).catch(reject);
        });
      });
    }

    // 2) 내가 refresh를 시작한다
    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      onRefreshed(newToken);

      // 실패했던 요청 재시도
      if (!original.headers) original.headers = {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api.request(original);
    } catch (e) {
      tokenStore.clear();
      // 리프레시도 실패 → 로그인으로 보내기
      // 여기서 전역 내비게이션 접근이 어려우면, 호출부에서 401 처리하거나
      // window.location으로 대체 가능
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
