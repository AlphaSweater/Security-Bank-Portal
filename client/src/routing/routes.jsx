// Centralized route config for client-side routing and navigation
import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import TransactionPage from "../pages/TransactionPage/TransactionPage";
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
    showFooter: false,
  },
  {
    path: "/auth",
    label: "Auth",
    element: <AuthPage />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
    showFooter: false,
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
  {
    path: "/transaction",
    label: "Transaction",
    element: (
      <PrivateRoute>
        <TransactionPage />
      </PrivateRoute>
    ),
    showInNav: false,  // Set to false since we're accessing it from the dashboard
    isPrivate: true,
    showNavbar: true,
    showFooter: true,
  },
  // Add more routes as needed
];

export default routes;
