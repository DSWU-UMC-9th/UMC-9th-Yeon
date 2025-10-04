import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const { pathname } = useLocation();
  const isMovieDetail = pathname.startsWith("/movie/");

  return (
    <div className={`min-h-screen ${isMovieDetail ? "bg-black" : "bg-white"}`}>
      <header className={`sticky top-0 z-10 backdrop-blur ${isMovieDetail ? "bg-black/80" : "bg-gray-100/80"}`}>
        <div className="max-w-7xl px-14 py-4 flex items-center justify-between">
          <Navbar />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
