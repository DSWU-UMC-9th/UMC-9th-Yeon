/* eslint-disable @typescript-eslint/no-explicit-any */

import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    console.log("✅ 로그인 상태 변경:", isAuthed, "token:", token);
  }, [isAuthed, token]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/signout", {}).catch(() => {});
    } finally {
      logout();
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

          const accessToken: string | undefined = data?.accessToken ?? data?.token;
          if (!accessToken) throw new Error("토큰이 응답에 없습니다.");

          // 서버 응답에서 사용자 정보를 최대한 유연하게 추출합니다.
          const rawUser = data?.user ?? data?.profile ?? data;
          const profile = {
            id: rawUser?.id ?? rawUser?.userId ?? rawUser?.sub ?? null,
            name:
              rawUser?.name ??
              rawUser?.nickname ??
              rawUser?.username ??
              (rawUser?.email ? String(rawUser.email).split("@")[0] : undefined),
            nickname: rawUser?.nickname ?? rawUser?.name ?? undefined,
            email: rawUser?.email ?? undefined,
            role: rawUser?.role ?? rawUser?.roles ?? undefined,
          };

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

  // ✅ 여기 로직을 바로잡습니다: 로그인되어 있으면 폼을 숨기고 안내/로그아웃만 보여줍니다.
  if (isAuthed) {
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
