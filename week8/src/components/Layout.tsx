import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import Fab from "./layout/Fab";
import { useSidebar } from "../hooks/useSidebar";

export default function Layout() {
  const { isOpen, close, toggle } = useSidebar();

  return (
    <div className={`min-h-screen bg-neutral-900 text-white`}>

      <Header onOpenSidebar={toggle} />

      <div className="flex">
        {/* 메인 */}
        <main className="overflow-scroll flex-1 p-4 md:p-6 bg-black h-screen">
          <Outlet />
        </main>
      </div>

      {/* 사이드바 오버레이 (모든 해상도 공통) */}
      <Sidebar isOpen={isOpen} onClose={close} />

      {/* 플로팅 버튼 */}
      <Fab />
    </div>
  );
}
