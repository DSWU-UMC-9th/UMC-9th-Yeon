import { RouterProvider, createBrowserRouter } from "react-router-dom";
import BasicFetchPage from "./pages/BasicFetchPage";
import PendingErrorPage from "./pages/PendingErrorPage";
import AdvancedFetchPage from "./pages/AdvancedFetchPage";
import ReactQueryPage from "./pages/ReactQueryPage";

function NotFound() {
  return <div>존재하지 않는 페이지입니다.</div>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <BasicFetchPage />,
    errorElement: <NotFound />,
  },
  {
    path: "/pending-error",
    element: <PendingErrorPage />,
  },
  {
    path: "/advanced-fetch",
    element: <AdvancedFetchPage />,
  },
  {
    path: "/react-query",
    element: <ReactQueryPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
