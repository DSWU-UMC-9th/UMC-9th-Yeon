// import { Outlet, useLocation } from "react-router-dom";
// import Navbar from "./Navbar";

// export default function Layout() {
//   const { pathname } = useLocation();
//   const isMovieDetail = pathname.startsWith("/movie/");
//   const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

//   return (
//     <div className={`min-h-screen ${isAuthPage ? "bg-black/50" : isMovieDetail ? "bg-black" : "bg-white"}`}>
//       <header
//         className={`sticky top-0 z-10 backdrop-blur ${isMovieDetail || isAuthPage ? "bg-black/80" : "bg-gray-100/80"}`}
//       >
//         <div className="max-w-8xl px-14 py-4 flex items-center justify-between">
//           <Navbar />
//         </div>
//       </header>
//       <Outlet />
//     </div>
//   );
// }

import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import Fab from "./layout/Fab";
import { useState, useRef, useEffect } from "react";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // 사이드바 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (backdropRef.current && e.target === backdropRef.current) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <Header onOpenSidebar={() => setOpen(true)} />
      <div className="flex">
        {/* 데스크탑 사이드바 */}
        <aside className="z-90 hidden md:block w-56 shrink-0 border-r border-neutral-800">
          <Sidebar />
        </aside>

        {/* 모바일 사이드바(버거로 오픈) */}
        {open && (
          <div ref={backdropRef} className="fixed inset-0 z-40 bg-black/60 md:hidden">
            <aside className="absolute left-0 top-0 h-full w-64 bg-neutral-950 p-4">
              <Sidebar onClose={() => setOpen(false)} />
            </aside>
          </div>
        )}

        {/* 메인 */}
        <main className="flex-1 p-4 md:p-6 bg-black h-screen">
          <Outlet />
        </main>
      </div>

      {/* 플로팅 버튼 */}
      <Fab />
    </div>
  );
}
