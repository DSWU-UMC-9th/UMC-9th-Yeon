import { NavLink, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();
  const isMovieDetail = pathname.startsWith("/movie/");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? isMovieDetail
        ? "font-semibold text-white"
        : "font-semibold text-green-700"
      : isMovieDetail
      ? "text-gray-500 hover:text-white"
      : "text-gray-500 hover:text-gray-900";

  if (isAuthPage) {
    return (
      <nav className="w-full flex items-center justify-between">
        <div className="text-pink-500 text-2xl font-bold">돌려돌려LP판</div>
        <div className="flex gap-2">
          <NavLink to="/login" className="bg-black text-white px-2 py-1 rounded">
            로그인
          </NavLink>
          <NavLink to="/signup" className="bg-pink-500 text-white px-2 py-1 rounded">
            회원가입
          </NavLink>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full flex items-center justify-between">
      <div className="flex gap-4 text-sm">
        <NavLink to="/" end className={linkCls}>
          홈
        </NavLink>
        <NavLink to="/popular" className={linkCls}>
          인기 영화
        </NavLink>
        <NavLink to="/now_playing" className={linkCls}>
          상영 중
        </NavLink>
        <NavLink to="/top_rated" className={linkCls}>
          평점 높은
        </NavLink>
        <NavLink to="/upcoming" className={linkCls}>
          개봉 예정
        </NavLink>
      </div>
      <NavLink to="/login" className={linkCls}>
        로그인
      </NavLink>
    </nav>
  );
}
