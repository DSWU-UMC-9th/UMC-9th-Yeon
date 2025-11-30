import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="flex justify-center min-h-screen text-black bg-white">
      <Outlet />
    </div>
  );
}