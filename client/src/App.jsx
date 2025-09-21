import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/LoginRegister";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navigation/Navbar";
import styles from "./App.module.css";

function App() {
  return (
    <Router>
      <div className={styles.appRoot}>
        <Navbar />
        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
