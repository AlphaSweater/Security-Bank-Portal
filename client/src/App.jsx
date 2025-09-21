// External Dependencies
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Page Components (Routes)
import Landing from "./pages/Landing";
import Login from "./pages/LoginRegister";
import Dashboard from "./pages/Dashboard";

// UI Components
import Navbar from "./components/Navigation/Navbar";

// Styles
import styles from "./App.module.css";

function App() {
  return (
    <Router>
      <div className={styles.appRoot}>
        {/* ===== Header (Navigation) ===== */}
        <header>
          <Navbar />
        </header>

        {/* ===== Main Content (Routes) ===== */}
        <main className={styles.contentContainer}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        {/* ===== Footer ===== */}
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
