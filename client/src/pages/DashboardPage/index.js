import React from "react";
import CustomerDashboard from "./CustomerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

function Dashboard({ user, ...props }) {
  // Default to customer if no user or role provided
  const role = user?.role || "customer";

  const Comp =
    role === "employee" || role === "admin"
      ? EmployeeDashboard
      : CustomerDashboard;

  return React.createElement(Comp, { ...props, role, user });
}

export default Dashboard;
export { CustomerDashboard, EmployeeDashboard };
