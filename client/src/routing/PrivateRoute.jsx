import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../utils/apiUtil";

export default function PrivateRoute({ children }) {
  const [auth, setAuth] = useState(null);

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

  if (auth === null) {
    return <div>Checking authentication...</div>;
  }

  return auth ? children : <Navigate to="/auth" replace />;
}
