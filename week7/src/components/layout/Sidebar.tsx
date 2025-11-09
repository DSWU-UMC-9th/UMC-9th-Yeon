import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../api/client";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const forceLogout = () => {
    try {
      // 1) 토큰/세션 완전 제거
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");

      // 혹시 다른 키로 저장된 토큰이 있으면 제거 (방어코드)
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } catch {}

    try {
      // 2) axios 기본 Authorization 헤더 제거 (메모리에 남은 헤더 초기화)
      if (client?.defaults?.headers?.common) {
        delete client.defaults.headers.common["Authorization"];
      }
    } catch {}

    try {
      // 3) React Query 캐시 정리
      queryClient.clear();
    } catch {}

    // 4) 로그인 화면으로 이동 + 하드 리프레시로 메모리 상태 초기화
    //    (Context/Zustand 등 별도 상태를 사용하는 경우 완전히 초기화 보장)
    navigate("/login", { replace: true });
    // 라우터 내 내비게이션 직후 강제 새로고침
    setTimeout(() => {
      window.location.replace("/login");
    }, 0);
  };

  const deleteAccount = useMutation({
    mutationFn: async () => {
      // explicitly fetch token (bypass interceptor uncertainty)
      const token =
        (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
        (typeof window !== "undefined" && sessionStorage.getItem("accessToken")) ||
        (typeof window !== "undefined" && localStorage.getItem("token")) ||
        (typeof window !== "undefined" && sessionStorage.getItem("token")) ||
        null;

      console.log("[DELETE /users] token from storage:", token ? token.slice(0, 12) + "…(" + token.length + ")" : null);

      if (!token) {
        const err: any = new Error("NO_TOKEN");
        err.code = "NO_TOKEN";
        throw err;
      }

      const res = await client.delete("/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    onSuccess: () => {
      forceLogout();
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const code = err?.code;
      console.error("[DELETE /users] failed", status, data, err);

      // If token is missing/expired, treat it as logged out
      if (code === "NO_TOKEN" || status === 401) {
        alert("인증이 만료되었어요. 다시 로그인해 주세요.");
        forceLogout();
        return;
      }

      const msg = data?.message || "탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.";
      alert(msg);
    },
  });

  const handleDelete = () => {
    if (onClose) onClose();
    if (window.confirm("정말 탈퇴하시겠습니까?")) {
      deleteAccount.mutate();
    }
  };

  const li = "block px-3 py-2 rounded hover:bg-neutral-800";
  return (
    <nav className="p-3 space-y-1">
      <NavLink to="/" className={li} onClick={onClose}>
        찾기
      </NavLink>
      <NavLink to="/my" className={li} onClick={onClose}>
        마이페이지
      </NavLink>
      <button
        type="button"
        className={`${li} ${deleteAccount.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
        onClick={handleDelete}
        disabled={deleteAccount.isPending}
        aria-label="탈퇴하기"
        title="탈퇴하기"
      >
        탈퇴하기
      </button>
    </nav>
  );
}
