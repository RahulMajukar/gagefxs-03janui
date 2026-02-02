// AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../Components/Layout/Layout";
import Login from "../Pages/Login";
import Dashboard from "../Pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import GageScanLanding from "../Pages/GageScanLanding";
import FunctionPage from "../Pages/Functions/FunctionPage";
import OperationPage from "../Pages/Operations/OperationPage";
import GageManagerPage from "../Components/Admin/GageManagerPage";
import AdminDashboard from "../Pages/DepartmentDash/AdminDashboard";
import ITAdminDashboard from "../Pages/DepartmentDash/ITAdminDashboard";
import CalendarPage from "../Components/calendar/CalendarPage";
import CalibrationDashboard from "../Pages/DepartmentDash/calibration/CalibrationDashboard";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <GageScanLanding />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:role"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard Route */}
        {/* Admin Dashboard Route */}
<Route
  path="/dashboard/admin"
  element={
    <ProtectedRoute allowedRoles={["ADMIN","IT_ADMIN"]}>
      <GageManagerPage />  {/* <-- Admin sees GageManagerPage by default */}
    </ProtectedRoute>
  }
/>


        {/* IT Admin Dashboard Route */}
        <Route
          path="/dashboard/it-admin"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />

       

        {/* Gage Manager Route */}
        <Route
          path="/gage-manager"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "INVENTORY_MANAGER"]}>
              <GageManagerPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Gage Management Only */}
        <Route
  path="/admin/gages"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/gage-inventory"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/gage-types"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/inhouse-calibration-machines"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/manufacturers"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/service-providers"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/suppliers"
  element={
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <GageManagerPage />
    </ProtectedRoute>
  }
/>


        {/* IT Admin Routes - User Management */}
        <Route
          path="/it-admin/users"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-admin/departments"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-admin/functions"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-admin/operations"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-admin/roles"
          element={
            <ProtectedRoute allowedRoles={["IT_ADMIN","CALIBRATION_MANAGER"]}>
              <ITAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/calibration"
          element={
            <ProtectedRoute >
              <CalibrationDashboard />
            </ProtectedRoute>
          }
        />

        {/* Function and Operation Routes */}
        <Route path="/functions/:functionId" element={<FunctionPage />} />
        <Route path="/operations/:operationId" element={<OperationPage />} />

        {/* Calendar Route */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
