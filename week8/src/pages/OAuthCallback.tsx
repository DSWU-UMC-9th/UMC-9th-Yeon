import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = params.get("accessToken");

    if (accessToken) {
      login(accessToken);

      navigate("/", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [params, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-800">
      구글 로그인 처리 중입니다. 잠시만 기다려주세요...
    </div>
  );
}
