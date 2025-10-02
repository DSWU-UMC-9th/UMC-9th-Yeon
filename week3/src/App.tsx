import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">인기 영화</h1>
              <p className="text-sm text-gray-500">The Movie Database (TMDB)</p>
            </div>
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "font-semibold" : "text-gray-600 hover:text-gray-900")}
              >
                Home
              </NavLink>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
