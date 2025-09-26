// PrivateRoute component for protecting routes in React Router v6+
import { Navigate } from "react-router-dom";

// TODO: Replace with real auth check (e.g., context, redux, cookie, etc.)
const isAuthenticated = () => {
  // For now, always return true to bypass auth check
  return true;
};

export default function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/auth" replace />;
}
