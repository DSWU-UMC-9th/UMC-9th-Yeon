import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    alert("로그인이 필요한 서비스입니다. 로그인을 해주세요!");
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  return children;
}
