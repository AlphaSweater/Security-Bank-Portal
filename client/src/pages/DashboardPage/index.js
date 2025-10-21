import React, { useState } from "react";
import CustomerDashboard from "./CustomerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

function Dashboard({ role: initialRole = "customer", ...props }) {
  const [role, setRole] = useState(initialRole);
  const Comp = role === "employee" ? EmployeeDashboard : CustomerDashboard;

  const toggleButton = React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setRole((r) => (r === "employee" ? "customer" : "employee")),
    },
    `Switch to ${role === "employee" ? "Customer" : "Employee"} View`
  );

  const toggleWrapper = React.createElement(
    "div",
    { style: { position: "fixed", top: 12, right: 12, zIndex: 1200 } },
    toggleButton
  );

  const dashboardEl = React.createElement(Comp, { ...props, role });

  return React.createElement(React.Fragment, null, toggleWrapper, dashboardEl);
}

export default Dashboard;
export { CustomerDashboard, EmployeeDashboard };
