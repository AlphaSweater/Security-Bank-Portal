import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Page from "./pages/Page";
import Landing from "./pages/Landing";
import Login from "./pages/LoginRegister";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navigation/Navbar";
import styles from "./App.module.css";

function App() {
  return (
    <Router>
      <div className={styles.appRoot}>
        <header>
          <Navbar />
        </header>
        <main className={styles.contentContainer}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/page" element={<Page />} />
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
