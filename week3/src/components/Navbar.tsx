import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "font-semibold text-green-700" : "text-gray-500 hover:text-gray-900";

  return (
    <nav className="flex gap-4 text-sm">
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
    </nav>
  );
}
