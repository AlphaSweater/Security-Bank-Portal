import { useEffect, useState, useRef, cloneElement } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../utils/apiUtil";

export default function PrivateRoute({ children, allowedRoles = null }) {
  const [authState, setAuthState] = useState({
    authenticated: null,
    user: null,
  });
  const lastChildren = useRef(children);
  const lastUser = useRef(null);

  if (authState.authenticated !== false) {
    lastChildren.current = children;
    if (authState.user) {
      lastUser.current = authState.user;
    }
  }

  useEffect(() => {
    let isMounted = true;
    apiRequest("/api/auth/sessionCheck")
      .then((res) => {
        if (isMounted) {
          setAuthState({
            authenticated: res.authenticated === true,
            user: res.authenticated ? { role: res.role } : null,
          });
        }
      })
      .catch(() => {
        if (isMounted) setAuthState({ authenticated: false, user: null });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // If not authenticated, redirect to login
  if (authState.authenticated === false) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated, check role-based authorization
  const userToPass = authState.user || lastUser.current;
  if (userToPass) {
    // If allowedRoles is specified, verify user has required role
    if (
      allowedRoles &&
      Array.isArray(allowedRoles) &&
      allowedRoles.length > 0
    ) {
      const hasAccess = allowedRoles.includes(userToPass.role);
      if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    // User is authorized - render children with role value
    return cloneElement(lastChildren.current, { role: userToPass.role });
  }

  // While checking and no user data yet, render without values
  return lastChildren.current;
}
