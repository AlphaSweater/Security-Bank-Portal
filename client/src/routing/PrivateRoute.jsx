import { useEffect, useState, useRef, cloneElement } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../utils/apiUtil";

export default function PrivateRoute({ children }) {
  const [authState, setAuthState] = useState({
    authenticated: null,
    user: null,
  });
  const lastChildren = useRef(children);
  const lastUser = useRef(null);

  // Save the last rendered children and user if auth is not false
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

  // If not authenticated, redirect
  if (authState.authenticated === false) {
    return <Navigate to="/auth" replace />;
  }

  // While checking or if authenticated, render children with user data
  // Clone the element and inject user prop
  const userToPass = authState.user || lastUser.current;
  if (userToPass) {
    return cloneElement(lastChildren.current, { user: userToPass });
  }

  // While checking and no user data yet, render without props
  return lastChildren.current;
}
