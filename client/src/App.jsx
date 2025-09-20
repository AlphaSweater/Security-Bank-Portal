import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/LoginRegister";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <div
        style={{ minHeight: "100vh", minWidth: "100vw", background: "#181926" }}
      >
        <nav
          style={{
            width: "100%",
            padding: "1.5rem 2rem",
            background: "#232946",
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            justifyContent: "center",
            position: "relative",
            left: 0,
            top: 0,
          }}
        >
          <Link
            to="/"
            style={{
              color: "#eebbc3",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Landing
          </Link>
          <Link
            to="/login"
            style={{
              color: "#eebbc3",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Login/Register
          </Link>
          <Link
            to="/dashboard"
            style={{
              color: "#eebbc3",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Dashboard
          </Link>
        </nav>

        <div
          style={{
            width: "100%",
            minHeight: "calc(100vh - 80px)",
            background: "#181926",
            padding: "2.5rem 2rem",
            boxSizing: "border-box",
            color: "#eebbc3",
          }}
        >
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
