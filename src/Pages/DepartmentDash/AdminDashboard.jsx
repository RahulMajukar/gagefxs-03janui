// src/Pages/DepartmentDash/AdminDashboard.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GageManagerPage from "../../Components/Admin/GageManagerPage";
import GageInventory from "../../Components/Admin/GageInventory";
import GageTypeInventory from "../../Components/Admin/GageTypeInventory";
import InhouseCalibrationMachineInventory from "../../Components/Admin/InhouseCalibrationMachineInventory";
import ManufacturerInventory from "../../Components/Admin/ManufacturerInventory";
import ServiceProviderInventory from "../../Components/Admin/ServiceProviderInventory";
import SupplierInventory from "../../Components/Admin/SupplierInventory";

const AdminDashboard = ({ users = [], roles = [], departments = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active section from URL path
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/admin/gages')) return 'gages';
    if (path.includes('/admin/gage-inventory')) return 'gage-inventory';
    if (path.includes('/admin/gage-types')) return 'gage-types';
    if (path.includes('/admin/inhouse-calibration-machines')) return 'inhouse-calibration-machines';
    if (path.includes('/admin/manufacturers')) return 'manufacturers';
    if (path.includes('/admin/service-providers')) return 'service-providers';
    if (path.includes('/admin/suppliers')) return 'suppliers';
    return null; // No dashboard overview anymore
  };

  const activeSection = getActiveSection();
  
  // Initialize with default data if none provided
  const initialDepartments = useMemo(
    () => (departments && departments.length > 0
      ? departments
      : [
          { id: "dept-f1", name: "F1" },
          { id: "dept-f2", name: "F2" },
          { id: "dept-store", name: "STORE" }
        ]),
    [departments]
  );

  const initialFunctions = useMemo(
    () => [
      { id: "func-f1", name: "F1" },
      { id: "func-f2", name: "F2" },
      { id: "func-f3", name: "F3" }
    ],
    []
  );

  const initialOperations = useMemo(
    () => [
      { id: "op-ot1", name: "OT1" },
      { id: "op-ot2", name: "OT2" },
      { id: "op-ot3", name: "OT3" }
    ],
    []
  );

  const initialRoles = useMemo(
    () => (roles && roles.length > 0
      ? roles
      : [
          { id: "role-admin", name: "ADMIN", description: "Full system access" },
          { id: "role-user", name: "USER", description: "Standard user access" },
          { id: "role-manager", name: "MANAGER", description: "Department management access" }
        ]),
    [roles]
  );

  const initialUsers = useMemo(
    () => (users && users.length > 0
      ? users
      : [
          {
            id: "user-admin",
            username: "soumik@gmail.com",
            firstName: "soumik",
            lastName: "mukherjee",
            department: initialDepartments[0],
            functions: initialFunctions,
            operations: initialOperations,
            role: initialRoles[0]
          }
        ]),
    [users, initialDepartments, initialFunctions, initialOperations, initialRoles]
  );

  // State management for all data
  const [managedDepartments, setManagedDepartments] = useState(initialDepartments);
  const [managedFunctions, setManagedFunctions] = useState(initialFunctions);
  const [managedOperations, setManagedOperations] = useState(initialOperations);
  const [managedUsers, setManagedUsers] = useState(initialUsers);
  const [managedRoles, setManagedRoles] = useState(initialRoles);

  // Handle section change
  const handleSectionChange = (section) => {
    switch (section) {
      case 'gages':
        navigate('/admin/gages');
        break;
      case 'gage-inventory':
        navigate('/admin/gage-inventory');
        break;
      case 'gage-types':
        navigate('/admin/gage-types');
        break;
      case 'manufacturers':
        navigate('/admin/manufacturers');
        break;
      case 'service-providers':
        navigate('/admin/service-providers');
        break;
      case 'suppliers':
        navigate('/admin/suppliers');
        break;
      case 'inhouse-calibration-machines':
        navigate('/admin/inhouse-calibration-machines');
        break;
      default:
        // Redirect to a default section if needed, e.g., gages
        navigate('/admin/gages');
    }
  };

  // Render the appropriate component based on active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case "gages":
        return <GageManagerPage />;
      case "gage-inventory":
        return <GageInventory />;
      case "gage-types":
        return <GageTypeInventory />;
      case "manufacturers":
        return <ManufacturerInventory />;
      case "service-providers":
        return <ServiceProviderInventory />;
      case "suppliers":
        return <SupplierInventory />;
      case "inhouse-calibration-machines":
        return <InhouseCalibrationMachineInventory isOpen={true} onClose={() => navigate('/admin/gage-types')} />;
      default:
        // If no valid section, show nothing or redirect
        return <div className="text-gray-500">Select a section from the sidebar.</div>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default AdminDashboard;