import React from "react";
import CustomerDashboard from "./CustomerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

function Dashboard({ role, ...props }) {
  // Default to customer if no role provided
  const usedRole = role || "customer";

  const Comp =
    usedRole === "employee" || usedRole === "admin"
      ? EmployeeDashboard
      : CustomerDashboard;

  return React.createElement(Comp, { ...props, role: usedRole });
}

export default Dashboard;
export { CustomerDashboard, EmployeeDashboard };
