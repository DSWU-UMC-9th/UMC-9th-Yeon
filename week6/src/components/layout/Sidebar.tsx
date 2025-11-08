import { NavLink } from "react-router-dom";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const li = "block px-3 py-2 rounded hover:bg-neutral-800";
  return (
    <nav className="p-3 space-y-1">
      <NavLink to="/" className={li} onClick={onClose}>
        찾기
      </NavLink>
      <NavLink to="/my" className={li} onClick={onClose}>
        마이페이지
      </NavLink>
    </nav>
  );
}
