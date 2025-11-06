import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import TransactionPage from "../pages/TransactionPage/TransactionPage";
import ForgotPassword from "../pages/PasswordReset/ForgotPassword";
import ResetPassword from "../pages/PasswordReset/ResetPassword";
import PendingTransactions from "../pages/EmployeeTransactions/PendingTransactions";
import ApprovedTransactions from "../pages/EmployeeTransactions/ApprovedTransactions";
import RejectedTransactions from "../pages/EmployeeTransactions/RejectedTransactions";
import TransactionReview from "../pages/EmployeeTransactions/TransactionReview";
import TransactionHistory from "../pages/EmployeeTransactions/TransactionHistory";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ManageEmployeesPage from "../pages/ManageEmployeesPage";

// Route meta: label for nav, element, auth, showInNav, allowedRoles

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
    element: <DashboardPage />,
    showInNav: true,
    isPrivate: true,
    showNavbar: true,
  },
  {
    path: "/transaction",
    label: "Transaction",
    element: <TransactionPage />,
    showInNav: false,
    isPrivate: true,
  },
  {
    path: "/transactions/pending",
    label: "Pending Transactions",
    element: <PendingTransactions />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["employee", "admin"],
  },
  {
    path: "/transactions/review/:id",
    label: "Transaction Review",
    element: <TransactionReview />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["employee", "admin"],
  },
  {
    path: "/transactions/history",
    label: "Transaction History",
    element: <TransactionHistory />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["employee", "admin"],
  },
  {
    path: "/transactions/approved",
    label: "Approved Transactions",
    element: <ApprovedTransactions />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["employee", "admin"],
  },
  {
    path: "/transactions/rejected",
    label: "Rejected Transactions",
    element: <RejectedTransactions />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["employee", "admin"],
  },
  {
    path: "/admin/employees",
    label: "Manage Employees",
    element: <ManageEmployeesPage />,
    showInNav: false,
    isPrivate: true,
    allowedRoles: ["admin"],
    showNavbar: true,
  },
  {
    path: "/auth/forgot-password",
    label: "Forgot Password",
    element: <ForgotPassword />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
    showFooter: false,
  },
  {
    path: "/auth/reset-password",
    label: "Reset Password",
    element: <ResetPassword />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
    showFooter: false,
  },
  {
    path: "/unauthorized",
    label: "Unauthorized",
    element: <UnauthorizedPage />,
    showInNav: false,
    isPrivate: false,
    showNavbar: false,
    showFooter: false,
  },
  // Add more routes as needed
];

export default routes;
