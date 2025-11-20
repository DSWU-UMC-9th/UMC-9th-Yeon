import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import OAuthCallback from "./pages/OAuthCallback";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/routing/ProtectedRoute";
import LpList from "./pages/LpList";
import LpDetail from "./pages/LpDetail";
import LpCreate from "./pages/LpCreate";
import MyPage from "./pages/MyPage";

function NotFound() {
  return <div className="p-8 text-center">존재하지 않는 페이지입니다.</div>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <LpList />
          </ProtectedRoute>
        ),
      },
      {
        path: "lps/:lpid",
        element: (
          <ProtectedRoute>
            <LpDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "lp/new",
        element: (
          <ProtectedRoute>
            <LpCreate />
          </ProtectedRoute>
        ),
      },
      {
        path: "my",
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
      },

      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },

      { path: "api/auth/google/callback", element: <OAuthCallback /> },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
