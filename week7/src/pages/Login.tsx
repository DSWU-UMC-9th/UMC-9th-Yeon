/* eslint-disable @typescript-eslint/no-explicit-any */

import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import Button from "../components/forms/Button";
import TextInput from "../components/forms/TextInput";
import { useForm } from "../hooks/useForm";
import googleLogo from "../assets/google.svg";
import backLogo from "../assets/back.svg";
import { useAuth } from "../hooks/useAuth";

type LoginValues = {
  email: string;
  password: string;
};

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, isAuthed, token } = useAuth();
  const isAuthedRef = useRef(isAuthed);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    isAuthedRef.current = isAuthed;
  }, [isAuthed]);

  // 스토리지/가시성 변화에 따라 토큰 상태를 재검증 (마운트/외부 이벤트 기반으로만 실행)
  useEffect(() => {
    let running = false;

    const checkToken = () => {
      if (running) return; // 재진입 방지
      running = true;
      let tk: string | null = null;
      try {
        tk = localStorage.getItem("accessToken") || localStorage.getItem("token");
      } catch {}
      // 로컬 스토리지에 토큰이 없는데 현재 컨텍스트는 로그인 상태라고 알고 있으면 강제 로그아웃
      if (!tk && isAuthedRef.current) {
        logout();
      }
      running = false;
    };

    // 초기 1회 점검
    checkToken();

    // 보이는 순간(탭 전환 등)과 다른 탭의 스토리지 변경에만 반응
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkToken();
    };

    window.addEventListener("storage", checkToken);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", checkToken);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logout]);

  useEffect(() => {
    console.log("✅ 로그인 상태 변경:", isAuthed, "token:", token);
  }, [isAuthed, token]);

  const handleLogout = async () => {
    try {
      // 토큰이 있을 때만 서버에 signout 요청을 보내고,
      // 토큰이 없으면 네트워크 호출 없이 클라이언트 상태만 정리합니다.
      let hasAuth = false;
      try {
        const tk = localStorage.getItem("accessToken") || localStorage.getItem("token");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hdr = (api.defaults.headers as any).common?.Authorization;
        hasAuth = !!tk || !!hdr;
      } catch {}

      if (hasAuth) {
        await api.post("/auth/signout", {}).catch(() => {});
      }
    } finally {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      } catch {}
      try {
        // 메모리에 남아있는 Authorization 헤더 제거
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (api.defaults.headers as any).common?.Authorization;
      } catch {}
      logout();
      // 무한 새로고침 방지를 위해 한 번만 자동 로그아웃 처리했음을 표시
      try {
        sessionStorage.setItem("didAutoLogout", "1");
      } catch {}
      navigate("/login", { replace: true });
    }
  };

  // 서버 리다이렉트용 OAuth 시작 주소 (api 인스턴스 baseURL 사용)
  const API_BASE = (api.defaults.baseURL as string) || "http://localhost:8000/v1";

  const { values, errors, touched, isValid, submitting, handleChange, handleBlur, handleSubmit } = useForm<LoginValues>(
    {
      initialValues: { email: "", password: "" },
      validate: (v) => {
        const errs: Partial<Record<keyof LoginValues, string>> = {};
        if (!emailRegex.test(v.email)) {
          errs.email = "올바른 이메일 형식을 입력해주세요.";
        }
        if (v.password.length < 6) {
          errs.password = "비밀번호는 최소 6자 이상이어야 합니다.";
        }
        return errs;
      },
      onSubmit: async ({ email, password }) => {
        try {
          setServerError(null);
          const { data } = await api.post("/auth/signin", { email, password });

          // 서버 응답 형태 정규화 (Swagger 기준: { status, statusCode, message, data: { id, name, accessToken, refreshToken } })
          const payload = data?.data ?? data;

          const accessToken: string | undefined = payload?.accessToken ?? payload?.token;
          const refreshToken: string | undefined = payload?.refreshToken;
          if (!accessToken) throw new Error("토큰이 응답에 없습니다.");

          // ✅ 토큰을 스토리지에 직접 저장해서 인터셉터/개별 요청이 확실히 읽도록
          try {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("token", accessToken); // 호환 키
            console.log("[LOGIN] stored accessToken prefix:", accessToken.slice(0, 12), "len:", accessToken.length);
          } catch {}

          // refreshToken이 있다면 보관 (useAuth가 지원한다면 전달)
          try {
            if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          } catch {}

          // 사용자 정보 (응답에 따라 유연 처리)
          const profile = {
            id: payload?.id ?? payload?.userId ?? payload?.sub ?? null,
            name:
              payload?.name ?? payload?.nickname ?? (payload?.email ? String(payload.email).split("@")[0] : undefined),
            nickname: payload?.nickname ?? payload?.name ?? undefined,
            email: payload?.email ?? undefined,
            role: payload?.role ?? payload?.roles ?? undefined,
          } as const;

          // 액세스토큰과 프로필을 로그인 컨텍스트에 전달
          login(accessToken, profile);

          const redirectTo = (location.state as any)?.from?.pathname ?? "/";
          navigate(redirectTo, { replace: true });
        } catch (e: any) {
          const msg = e?.response?.data?.message || e?.message || "로그인에 실패했습니다.";
          setServerError(Array.isArray(msg) ? msg.join("\n") : String(msg));
        }
      },
    }
  );

  // 탈퇴/강제 로그아웃: 쿼리나 라우터 state가 명시적으로 요구할 때만 수행
  const didAutoLogout = useRef(false);
  useEffect(() => {
    if (didAutoLogout.current) return;

    // 무한 루프 방지: 같은 세션에서 한 번만 자동 로그아웃
    try {
      if (sessionStorage.getItem("didAutoLogout") === "1") return;
    } catch {}

    const params = new URLSearchParams(location.search);
    const mustLogout = params.get("loggedout") === "1" || Boolean((location.state as any)?.forceLogout);

    if (mustLogout) {
      didAutoLogout.current = true;
      handleLogout();
    }
  }, [location.search, location.state]);

  // isAuthed 이면서 실제 스토리지에도 토큰이 있을 때만 "이미 로그인" 뷰 노출
  if (
    isAuthed &&
    (typeof window === "undefined" ? false : !!(localStorage.getItem("accessToken") || localStorage.getItem("token")))
  ) {
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center px-4">
        <div className="w-full max-w-md text-center">
          <p className="mb-6 text-lg">이미 로그인된 상태입니다 </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => navigate("/", { replace: true })}>홈으로 가기</Button>
            <Button onClick={handleLogout} className="border border-gray-700 bg-transparent text-gray-200">
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 미로그인 상태 → 로그인 폼 렌더
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        {/* 뒤로가기 */}
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mb-2 w-fit rounded-md px-2 py-1 text-sm text-gray-30"
            aria-label="이전 페이지로 이동"
          >
            <img src={backLogo} alt="back" className="mr-2 h-5 w-5" />
          </button>

          <h1 className="ml-35 text-center text-xl font-semibold">로그인</h1>
        </div>

        {/* 구글 로그인 */}
        <Button
          onClick={() => {
            // 구글 OAuth 시작: 서버로 리다이렉트
            window.location.assign(`${API_BASE}/auth/google/login`);
          }}
          className="border border-gray-700 bg-transparent text-gray-200 hover:bg-gray-800 flex items-center justify-center"
        >
          <img src={googleLogo} alt="Google" className="mr-2 h-5 w-5" />
          구글 로그인
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-700" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-700" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            name="email"
            type="email"
            placeholder="이메일을 입력해주세요!"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : undefined}
            aria-invalid={!!(touched.email && errors.email)}
            aria-describedby="email-error"
          />
          <TextInput
            name="password"
            type="password"
            placeholder="비밀번호를 입력해주세요!"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : undefined}
            aria-invalid={!!(touched.password && errors.password)}
            aria-describedby="password-error"
          />

          {serverError && (
            <p className="text-sm text-red-400" role="alert">
              {serverError}
            </p>
          )}

          {/* 로그인 버튼: 이메일 + 비번 모두 유효할 때만 활성화 */}
          <Button type="submit" loading={submitting} disabled={!isValid} className="mt-2">
            로그인
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LogoutButton({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/signout", {}).catch(() => {});
    } finally {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      } catch {}
      try {
        // 메모리에 남아있는 Authorization 헤더 제거
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (api.defaults.headers as any).common?.Authorization;
      } catch {}
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <button onClick={handleLogout} className={className}>
      로그아웃
    </button>
  );
}
