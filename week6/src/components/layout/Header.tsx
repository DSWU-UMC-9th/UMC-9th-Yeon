import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu } from "lucide-react";

export default function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { isAuthed, profile, logout } = useAuth();
  const displayName = profile?.name ?? profile?.nickname ?? profile?.email ?? "사용자";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-14 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <button className="md:hidden p-2" aria-label="open" onClick={onOpenSidebar}>
        <Menu />
      </button>

      <Link to="/" className="text-pink-500 font-bold text-xl">
        돌려돌려LP판
      </Link>

      <div className="flex items-center gap-2">
        {!isAuthed ? (
          <>
            <NavLink to="/login" className="px-3 py-1 rounded bg-black">
              로그인
            </NavLink>
            <NavLink to="/signup" className="px-3 py-1 rounded bg-pink-600">
              회원가입
            </NavLink>
          </>
        ) : (
          <div className="flex items-center gap-3">
            {profile ? (
              <span className="text-sm text-neutral-300">{displayName}님 반갑습니다.</span>
            ) : (
              <span className="text-sm text-neutral-500">로딩중…</span>
            )}
            <button onClick={logout} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
