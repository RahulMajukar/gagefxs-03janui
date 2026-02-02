// src/components/Dashboard.jsx 
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

// Existing role-based dashboards
import FunctionPage from "../Pages/Functions/FunctionPage";
import OperationPage from "../Pages/Operations/OperationPage";
import OperatorDashboard from "../Pages/DepartmentDash/OperatorDashboard";
import CribManagerDashboard from "../Pages/DepartmentDash/CribManagerDashboard";
import AdminDashboard from "../Pages/DepartmentDash/AdminDashboard";
import ITAdminDashboard from "../Pages/DepartmentDash/ITAdminDashboard";
import CalibrationManagerDashboard from "../Pages/DepartmentDash/calibration/CalibrationDashboard";

// NEW: Plant HOD Dashboard
import PlantHODDashboard from "../Pages/DepartmentDash/PlantHODDashboard";
import PlantHeadDash from "./DepartmentDash/PlantHeadDash";
import QCMngrDashboard from "./DepartmentDash/QCMngrDashboard";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [adminData, setAdminData] = useState({ users: [], roles: [], departments: [] });
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  // Redirect unauthenticated users
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { role, functions = [], operations = [] } = user;
  const noModulesAssigned = functions.length === 0 && operations.length === 0;

  // Fetch admin data if the user is ADMIN, CALIBRATION_MANAGER, or IT_ADMIN
  useEffect(() => {
    if (role === "ADMIN" || role === "CALIBRATION_MANAGER" || role === "IT_ADMIN") {
      setLoadingAdminData(true);
      axios
        .get("/api/admin/dashboard-data", {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        .then((res) => setAdminData(res.data))
        .catch((err) => console.error("Failed to load admin data:", err))
        .finally(() => setLoadingAdminData(false));
    }
  }, [role, user.token]);

  // Render dashboard based on user role
  const renderDashboardByRole = () => {
    switch (role) {
      case "OPERATOR":
        return (
          <>
            <OperatorDashboard functions={functions} operations={operations} />
            {operations.length > 0 && <OperationPage user={user} />}
          </>
        );

      case "CRIB_MANAGER":
        return <CribManagerDashboard functions={functions} operations={operations} />;

      case "FUNCTION":
        return functions.length > 0 ? <FunctionPage user={user} /> : null;

      case "ADMIN":
        if (loadingAdminData) return <p className="text-blue-700">Loading admin data...</p>;
        return (
          <AdminDashboard
            users={adminData.users}
            roles={adminData.roles}
            departments={adminData.departments}
          />
        );

      case "IT_ADMIN":
        if (loadingAdminData) return <p className="text-blue-700">Loading IT admin data...</p>;
        return (
          // <ITAdminDashboard
          //   users={adminData.users}
          //   roles={adminData.roles}
          //   departments={adminData.departments}
          // />
          <QCMngrDashboard/>
        );

      case "CALIBRATION_MANAGER":
        if (loadingAdminData) return <p className="text-blue-700">Loading calibration manager data...</p>;
        return (
          // <CalibrationManagerDashboard
          //   users={adminData.users}
          //   roles={adminData.roles}
          //   departments={adminData.departments}
          // />
          <PlantHeadDash/>
        );

      case "PLANT_HOD":
        return <PlantHODDashboard />;

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* <h1 className="text-4xl font-semibold text-blue-800 mb-2 ml-[50px]">{role.replace('_', ' ')} Dashboard</h1> */}
      {renderDashboardByRole()}

      {/* Fallback: No modules assigned (for non-admin roles) */}
      {noModulesAssigned &&
        !["ADMIN", "IT_ADMIN", "CALIBRATION_MANAGER", "PLANT_HOD"].includes(role) && (
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
            ⚠️ No modules assigned for your role. Please contact your administrator.
          </div>
        )}
    </div>
  );
};

export default Dashboard;