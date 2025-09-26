// External Dependencies
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import routes from "./routing/routes.jsx";
import PageTransition from "components/PageTransition/PageTransition";

// ...existing code...

// UI Components
import Navbar from "components/Navbar";

// Styles
import styles from "./App.module.css";

function AppContent() {
  const location = useLocation();
  // Find the first matching route (exact match)
  const currentRoute = routes.find((r) => r.path === location.pathname);
  const showNavbar = currentRoute ? currentRoute.showNavbar !== false : true;
  return (
    <div className={styles.appRoot}>
      <header>{showNavbar && <Navbar />}</header>

      <PageTransition locationKey={location.key}>
        <main className={styles.contentContainer}>
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

      <footer className={styles.footer}>
        <small>
          &copy; {new Date().getFullYear()} Security Bank Portal &mdash; All
          rights reserved.
        </small>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router basename="/SecurityBankPortal">
      <AppContent />
    </Router>
  );
}

export default App;
