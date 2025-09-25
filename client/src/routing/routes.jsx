// Centralized route config for client-side routing and navigation
import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import PrivateRoute from "./PrivateRoute";

// Route meta: label for nav, element, auth, showInNav

const routes = [
  {
    path: "/",
    label: "Landing",
    element: <LandingPage />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
  },
  {
    path: "/auth",
    label: "Auth",
    element: <AuthPage />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    element: (
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ),
    showInNav: true,
    isPrivate: true,
    showNavbar: true,
  },
  // Add more routes as needed
];

export default routes;
