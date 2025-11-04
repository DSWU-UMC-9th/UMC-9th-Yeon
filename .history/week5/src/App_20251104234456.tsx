import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Popular from "./pages/Popular";
import Upcoming from "./pages/Upcoming";
import TopRated from "./pages/TopRated";
import NowPlaying from "./pages/NowPlaying";
import MovieDetail from "./pages/MovieDetail";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ProtectedRoute from "./components/routing/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
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
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
