import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-gray-100/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">영화</h1>
          </div>
          <Navbar />
        </div>
      </header>
      <Outlet />
    </div>
  );
}
