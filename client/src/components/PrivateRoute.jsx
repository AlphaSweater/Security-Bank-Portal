// PrivateRoute component for protecting routes in React Router v6+
import { Navigate } from "react-router-dom";

// Dummy auth check (replace with real logic)
const isAuthenticated = () => {
  // TODO: Replace with real auth check (e.g., context, redux, cookie, etc.)
  return !!localStorage.getItem("authToken");
};

export default function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/auth" replace />;
}
