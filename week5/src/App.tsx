import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Popular from "./pages/Popular";
import Upcoming from "./pages/Upcoming";
import TopRated from "./pages/TopRated";
import NowPlaying from "./pages/NowPlaying";
import MovieDetail from "./pages/MovieDetail";
import OAuthCallback from "./pages/OAuthCallback";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/routing/ProtectedRoute";

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
            {" "}
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "popular",
        element: (
          <ProtectedRoute>
            <Popular />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "upcoming",
        element: (
          <ProtectedRoute>
            <Upcoming />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "top_rated",
        element: (
          <ProtectedRoute>
            <TopRated />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "now_playing",
        element: (
          <ProtectedRoute>
            <NowPlaying />{" "}
          </ProtectedRoute>
        ),
      },
      {
        path: "movie/:movieId",
        element: (
          <ProtectedRoute>
            <MovieDetail />{" "}
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
