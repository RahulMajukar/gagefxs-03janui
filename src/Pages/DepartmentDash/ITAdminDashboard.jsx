import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import UserManager from "../../Components/ITAdmin/UserManager";
import DepartmentManager from "../../Components/ITAdmin/DepartmentManager";
import FunctionManager from "../../Components/ITAdmin/FunctionManager";
import OperationManager from "../../Components/ITAdmin/OperationManager";
import RoleManager from "../../Components/ITAdmin/RoleManager";
// 👇 NEW: Import Chat Group Management Modal
import GroupManagementModal from "../../Components/forum/GroupManagementModal";
 
// APIs — now includes forum APIs from shared api.js
import {
  getUsers,
  getDepartments,
  getFunctions,
  getOperations,
  getRoles,
  fetchAllGroups,
  createForumGroup,
  deleteForumGroup,
  updateForumGroup,
} from "../../api/api";
 
// === Clean, Valid SVG Icons (from Heroicons Outline) ===
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const BuildingOfficeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m18-18V3m-18 0h18M3 12h18M3 18h18M12 3v18" />
  </svg>
);
const CogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
  </svg>
);
const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
// 👇 NEW: Chat Icon (from Lucide or Heroicons style)
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
       viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" 
       className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" 
          d="M7 8h10a4 4 0 014 4v4a4 4 0 01-4 4H9l-5 3v-3H5a4 4 0 01-4-4v-4a4 4 0 014-4z" />
    <circle cx="6" cy="14" r="0.4" fill="currentColor" />
    <circle cx="10" cy="14" r="0.4" fill="currentColor" />
    <circle cx="14" cy="14" r="0.4" fill="currentColor" />
  </svg>


);
 
// === Professional Analytics Card ===
const AnalyticsCard = ({ label, count, color, icon: Icon, onClick }) => {
  const bgClasses = {
    indigo: "bg-blue-50 border-blue-200",
    green: "bg-emerald-50 border-emerald-200",
    yellow: "bg-amber-50 border-amber-200",
    red: "bg-rose-50 border-rose-200",
    purple: "bg-violet-50 border-violet-200",
    blue: "bg-indigo-50 border-indigo-200", // 👈 for Chat
  };
  const iconColor = {
    indigo: "text-blue-600",
    green: "text-emerald-600",
    yellow: "text-amber-600",
    red: "text-rose-600",
    purple: "text-violet-600",
    blue: "text-indigo-600",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-5 rounded-lg border transition-all hover:shadow-sm hover:border-gray-300 ${bgClasses[color]}`}
    >
      <div className={`${iconColor[color]}`}>
        <Icon />
      </div>
      <span className="text-2xl font-bold text-gray-800 mt-2">{count}</span>
      <span className="mt-1 text-sm font-medium text-gray-600">{label}</span>
    </button>
  );
};
 
const ITAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [roles, setRoles] = useState([]);
  // 👇 NEW: State for Chat Modal
  const [showChatModal, setShowChatModal] = useState(false);
  const [forumGroups, setForumGroups] = useState([]);
 
 const fetchAllData = async () => {
  try {
    const [u, d, f, o, r] = await Promise.all([
      getUsers(),
      getDepartments(),
      getFunctions(),
      getOperations(),
      getRoles(),
    ]);

    // Normalize user objects to have flat string fields
    const normalizedUsers = u.map(user => {
      // Extract department name (if it's an object or array)
      const department = Array.isArray(user.departments)
        ? user.departments.map(dep => dep.name || dep).join(', ')
        : typeof user.department === 'object'
        ? user.department.name || user.department.id || ''
        : user.department || '';

      // Extract function name
      const func = Array.isArray(user.functions)
        ? user.functions.map(fn => fn.name || fn).join(', ')
        : typeof user.function === 'object'
        ? user.function.name || user.function.id || ''
        : user.function || '';

      // Extract operation name
      const operation = Array.isArray(user.operations)
        ? user.operations.map(op => op.name || op).join(', ')
        : typeof user.operation === 'object'
        ? user.operation.name || user.operation.id || ''
        : user.operation || '';

      return {
        ...user,
        department,   // now a string
        function: func,
        operation,
        role: typeof user.role === 'object' ? user.role.name || user.role : user.role || '',
      };
    });

    setUsers(normalizedUsers);
    setDepartments(d);
    setFunctions(f);
    setOperations(o);
    setRoles(r);
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
  }
};
 
  const fetchForumGroups = async () => {
  try {
    const groups = await fetchAllGroups();
    // ✅ Ensure it's an array
    setForumGroups(Array.isArray(groups) ? groups : []);
  } catch (err) {
    console.error("Failed to fetch forum groups:", err);
    // alert("Failed to load chat groups");
    setForumGroups([]); // ✅ fallback to empty array
  }
};
 
  useEffect(() => {
  fetchAllData();
  fetchForumGroups(); // fetch once
  const interval = setInterval(() => {
    fetchAllData();
    fetchForumGroups();
  }, 5000);
  return () => clearInterval(interval);
}, []);
 
 
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes("/it-admin/users")) return "users";
    if (path.includes("/it-admin/departments")) return "departments";
    if (path.includes("/it-admin/functions")) return "functions";
    if (path.includes("/it-admin/operations")) return "operations";
    if (path.includes("/it-admin/roles")) return "roles";
    return "users";
  };
 
  const activeSection = getActiveSection();
 
  useEffect(() => {
    if (location.pathname === "/dashboard/it-admin") {
      navigate("/it-admin/users", { replace: true });
    }
  }, [location.pathname, navigate]);
 
  const handleSectionChange = (section) => {
    navigate(`/it-admin/${section}`);
  };
 
  // 👇 NEW: Handle Chat Forum button click
  const handleOpenChatForum = () => {
    setShowChatModal(true);
  };
 
  const analyticsData = useMemo(() => [
    { label: "Users", count: users.length, color: "indigo", section: "users", icon: UserIcon },
    { label: "Departments", count: departments.length, color: "green", section: "departments", icon: BuildingOfficeIcon },
    { label: "Functions", count: functions.length, color: "yellow", section: "functions", icon: CogIcon },
    { label: "Operations", count: operations.length, color: "red", section: "operations", icon: WrenchIcon },
    { label: "Roles", count: roles.length, color: "purple", section: "roles", icon: ShieldCheckIcon },
    // 👇 NEW: Chat Forum Card
    { label: "Chat Forum", count: forumGroups.length, color: "blue", section: "chat", icon: ChatIcon },
  ], [users, departments, functions, operations, roles, forumGroups]);

  const renderActiveSection = () => {
    if (activeSection === "chat") {
      // This won't render in main content since we use modal
      return null;
    }
    switch (activeSection) {
      case "users":
        return <UserManager users={users} departments={departments} functions={functions} operations={operations} roles={roles} onUsersChange={fetchAllData} />;
      case "departments":
        return <DepartmentManager departments={departments} onDepartmentsChange={fetchAllData} />;
      case "functions":
        return <FunctionManager functions={functions} onFunctionsChange={fetchAllData} />;
      case "operations":
        return <OperationManager operations={operations} onOperationsChange={fetchAllData} />;
      case "roles":
        return <RoleManager roles={roles} onRolesChange={fetchAllData} />;
      default:
        return null;
    }
  };
 
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* 👇 NEW: Render Chat Modal WITH ALL REQUIRED PROPS */}
      <GroupManagementModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        groups={forumGroups}
        users={users}
        onCreateGroup={async (groupData) => {
          const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
          const createdBy = storedUser?.username || storedUser?.email || null;
          await createForumGroup({ ...groupData, createdBy });
          await fetchForumGroups();
        }}
        onDeleteGroup={async (groupId) => {
          await deleteForumGroup(groupId);
          await fetchForumGroups();
        }}
        onUpdateGroup={async (groupId, updates) => {
          await updateForumGroup(groupId, updates);
          await fetchForumGroups();
        }}
      />
 
      <div className="p-6 max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Plant Head Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage system entities and access controls</p>
        </div>
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 mb-8">
          {/* {analyticsData.map((card) => (
            <AnalyticsCard
              key={card.section}
              {...card}
              onClick={
                card.section === "chat"
                  ? handleOpenChatForum
                  : () => handleSectionChange(card.section)
              }
            />
          ))} */}
        </div>
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 border-b border-gray-200">
            {analyticsData
              .filter(card => card.section !== "chat") // 👈 Exclude chat from tabs
              .map(({ section, label, icon: Icon }) => (
                <button
                  key={section}
                  onClick={() => handleSectionChange(section)}
                  className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 ${
                    activeSection === section
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            {/* 👇 NEW: Chat Forum Tab */}
            <button
              onClick={handleOpenChatForum}
              className="px-4 py-3 text-sm font-medium flex items-center space-x-2 text-gray-500 hover:text-gray-700"
            >
              <ChatIcon />
              <span>Chat Forum</span>
            </button>
          </nav>
        </div>
        {/* Active Section Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};
 
export default ITAdminDashboard;
