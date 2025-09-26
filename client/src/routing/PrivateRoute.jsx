import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../utils/apiUtil";

export default function PrivateRoute({ children }) {
  const [auth, setAuth] = useState(null);
  const lastChildren = useRef(children);

  // Save the last rendered children if auth is not false
  if (auth !== false) {
    lastChildren.current = children;
  }

  useEffect(() => {
    let isMounted = true;
    apiRequest("/api/auth/sessionCheck")
      .then((res) => {
        if (isMounted) setAuth(res.authenticated === true);
      })
      .catch(() => {
        if (isMounted) setAuth(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // If not authenticated, redirect
  if (auth === false) {
    return <Navigate to="/auth" replace />;
  }

  // While checking, keep rendering the last page
  return lastChildren.current;
}
