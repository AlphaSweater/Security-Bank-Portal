// External Dependencies
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { getCsrfToken } from "./utils/csrfUtil";
import routes from "./routing/routes.jsx";
import PageTransition from "components/PageTransition/PageTransition";

// UI Components
import Navbar from "components/Navbar";

// Styles
import styles from "./App.module.css";

function AppContent() {
  // Fetch CSRF token
  useEffect(() => {
    getCsrfToken();
  }, []);

  const location = useLocation();
  // Find the first matching route (exact match)
  const currentRoute = routes.find((r) => r.path === location.pathname);
  const showNavbar = currentRoute ? currentRoute.showNavbar !== false : true;
  const _showFooter = currentRoute ? currentRoute.showFooter !== false : true;
  const isLanding = location.pathname === "/";
  return (
    <div className={styles.appRoot}>
      <header>{showNavbar && <Navbar />}</header>

      <PageTransition locationKey={location.key}>
        <main className={isLanding ? styles.contentFullBleed : styles.contentContainer}>
          <Routes location={location}>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
        </main>
      </PageTransition>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
