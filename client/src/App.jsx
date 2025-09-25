// External Dependencies
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Page Components (Routes)
import LandingPage from "pages/LandingPage";
import AuthPage from "pages/AuthPage";
import DashboardPage from "pages/DashboardPage";

// UI Components
import Navbar from "components/Navbar";
import Navbar2 from "components/Navbar2";

// Styles
import styles from "./App.module.css";

function App() {
  return (
    <Router>
      <div className={styles.appRoot}>
        <header>
          <Navbar2 />
        </header>

        <main className={styles.contentContainer}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>

        <footer className={styles.footer}>
          <small>
            &copy; {new Date().getFullYear()} Security Bank Portal &mdash; All
            rights reserved.
          </small>
        </footer>
      </div>
    </Router>
  );
}

export default App;
