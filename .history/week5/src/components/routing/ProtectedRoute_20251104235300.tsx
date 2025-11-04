import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    // 비로그인 → 로그인 페이지로 이동 + 되돌아올 경로 기억
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
