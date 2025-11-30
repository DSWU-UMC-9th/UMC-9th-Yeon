import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import PlaylistPage from "@/pages/PlaylistPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <PlaylistPage />,
      },
    ],
  },
]);