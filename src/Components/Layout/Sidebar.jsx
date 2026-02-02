// src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import gagefxlogo from "../../assets/GageFXlogo.png";
import companyLogo from "../../assets/HTF.png";
import profileLogo from "../../assets/profile1.jpg";
import {
  Home,
  Building2,
  Workflow,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  LogOut,
  Ruler,
  Bell,
  MessageCircle,
  User,
  QrCode,
  X,
  ChevronLeft,
  Calendar,
  MapPin,
  Menu,
} from "lucide-react";

// ✅ IMPORTS YOU REQUESTED
import GageScanner from '../Layout/GageScanner';
import ProfileModal from "./Profile";
import ReallocationManagementModal from '../../Components/ReallocationManagementModal';
import { getReallocatesByStatus } from '../../api/api';
import api from "../../api/axios";
import ChatDrawer from "../forum/ChatDrawer";
import OperatorReallocationNotifications from "../Operator/OperatorReallocationNotifications";
import { Tooltip } from "react-tooltip";

import NotificationManager from '../../Components/notifications/NotificationManager';
import { useNotifications } from '../../providers/NotificationProvider'; // ✅ New import

// 🔊 Generate a short beep sound
const generateBeepSound = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = 1000;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.8);
  return () => {
    try {
      oscillator.disconnect();
      gainNode.disconnect();
    } catch (e) { /* ignore */ }
  };
};

export default function Sidebar({
  isSidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed
}) {
  const { user, loading, hasRole, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    departments: false,
    functions: false,
    operations: false,
    admin: false,
    calibration: false,
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showReallocFeature, setShowReallocFeature] = useState(false);
  const [hodNotificationCount, setHodNotificationCount] = useState(0);
  const [operatorNotificationCount, setOperatorNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [location, setLocation] = useState("Fetching location...");

  // ✅ MODAL/DRAWER STATES
  const [showScanner, setShowScanner] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReallocModal, setShowReallocModal] = useState(false);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [showOperatorNotificationModal, setShowOperatorNotificationModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // ✅ ADD NOTIFICATION PANEL STATE
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  
  const [userInfo, setUserInfo] = useState({ 
    username: "", 
    role: "PLANT_HEAD", 
    profileImage: profileLogo 
  });
  
  const prevHodNotificationCountRef = useRef(0);
  const prevOperatorNotificationCountRef = useRef(0);

  // ✅ GET NOTIFICATION COUNT FROM NOTIFICATION MANAGER
  const { unreadCount: systemNotificationsCount } = useNotifications();

  const username = user?.username || user?.name || user?.email || "User";

  // Fetch user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      const userObj = parsed.user || parsed.data || parsed.result || parsed;
      const toRoleString = (u) => {
        if (!u) return "";
        if (u.role) return typeof u.role === "string" ? u.role : u.role.name || "";
        if (u.roles && Array.isArray(u.roles) && u.roles[0]) return typeof u.roles[0] === "string" ? u.roles[0] : u.roles[0].name || "";
        return "";
      };

      const roleStr = toRoleString(userObj) || "";
      const usernameStr = userObj?.username || userObj?.userName || userObj?.name || parsed.username || "Guest";

      setUserInfo({
        username: usernameStr,
        role: roleStr || "User",
        profileImage: profileLogo,
      });
    } catch (err) {
      console.warn("Failed to parse stored user:", err?.message || err);
      setUserInfo({
        username: "Guest",
        role: "User",
        profileImage: profileLogo,
      });
    }
  }, []);

  // Determine reallocation access
  useEffect(() => {
    if (user) {
      const role = (user.role?.toString() || "").toLowerCase();
      const show = role.includes("hod") || role.includes("plant_hod") || role.includes("planthod");
      setShowReallocFeature(show);
    }
  }, [user]);

  // Fetch HOD notifications
  const fetchHodNotificationCount = async () => {
    if (!showReallocFeature) return;
    try {
      const pending = await getReallocatesByStatus('PENDING_APPROVAL');
      setHodNotificationCount(pending.length || 0);
    } catch (err) {
      console.error('Error fetching realloc count:', err);
      setHodNotificationCount(0);
    }
  };

  // Fetch Operator notifications
  const fetchOperatorNotificationCount = async () => {
    try {
      const [approvedResult, cancelledResult, returnedResult] = await Promise.allSettled([
        getReallocatesByStatus('APPROVED'),
        getReallocatesByStatus('CANCELLED'),
        getReallocatesByStatus('RETURNED')
      ]);

      let allReallocations = [];

      if (approvedResult.status === 'fulfilled') {
        allReallocations.push(...approvedResult.value);
      }
      if (cancelledResult.status === 'fulfilled') {
        allReallocations.push(...cancelledResult.value);
      }
      if (returnedResult.status === 'fulfilled') {
        allReallocations.push(...returnedResult.value);
      }

      const filteredNotifications = allReallocations
        .filter(r => r.notes && r.notes.includes(`Notify Operator: ${userInfo.username}`))
        .map(r => ({
          id: r.id,
          reallocateId: r.id,
          gageSerialNumber: r.gageSerialNumber,
          gageTypeName: r.gageTypeName,
          status: r.status,
          message: r.status === 'APPROVED' ? `Your request for ${r.gageSerialNumber} has been APPROVED.` :
            r.status === 'CANCELLED' ? `Your request for ${r.gageSerialNumber} has been CANCELLED.` :
              r.status === 'RETURNED' ? `${r.gageSerialNumber} has been returned.` :
                `Status update for ${r.gageSerialNumber}.`,
          timestamp: r.approvedAt || r.cancelledAt || r.returnedAt || r.updatedAt,
          read: r.acknowledgedByOperator || false,
        }));

      const unacknowledgedCount = filteredNotifications.filter(n => !n.read).length;
      setOperatorNotificationCount(unacknowledgedCount);
    } catch (err) {
      console.error('Error fetching operator notification count:', err);
      setOperatorNotificationCount(0);
    }
  };

  // Fetch notifications if eligible
  useEffect(() => {
    if (showReallocFeature) {
      fetchHodNotificationCount();
    } else {
      setHodNotificationCount(0);
    }
    
    const showOperatorNotifications = (userInfo.role || "").toLowerCase().includes("operator");
    if (showOperatorNotifications) {
      fetchOperatorNotificationCount();
    } else {
      setOperatorNotificationCount(0);
    }
  }, [showReallocFeature, userInfo]);

  // Sound effect for new notifications
  useEffect(() => {
    const prevHodCount = prevHodNotificationCountRef.current;
    const newHodCount = hodNotificationCount;
    const prevOpCount = prevOperatorNotificationCountRef.current;
    const newOpCount = operatorNotificationCount;

    if (!isMuted) {
      if (showReallocFeature && newHodCount > prevHodCount && newHodCount > 0) {
        const newHodNotifications = newHodCount - prevHodCount;
        for (let i = 0; i < newHodNotifications; i++) {
          setTimeout(() => generateBeepSound(), i * 600);
        }
      }

      const showOperatorNotifications = (userInfo.role || "").toLowerCase().includes("operator");
      if (showOperatorNotifications && newOpCount > prevOpCount && newOpCount > 0) {
        const newOpNotifications = newOpCount - prevOpCount;
        for (let i = 0; i < newOpNotifications; i++) {
          setTimeout(() => generateBeepSound(), i * 600);
        }
      }
    }

    prevHodNotificationCountRef.current = newHodCount;
    prevOperatorNotificationCountRef.current = newOpCount;
  }, [hodNotificationCount, operatorNotificationCount, showReallocFeature, userInfo, isMuted]);

  // Time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
    };
    updateTime();
    const id = setInterval(updateTime, 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await api.get(
              `/public/geocode?lat=${latitude}&lon=${longitude}`
            );
            const data = response.data;
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "Unknown";
            const country = data.address?.country || "Unknown";
            setLocation(`${city}, ${country}`);
          } catch (err) {
            console.error("Geocode fetch failed:", err);
            setLocation("Location unavailable");
          }
        },
        () => setLocation("Permission denied")
      );
    } else {
      setLocation("Geolocation not supported");
    }
  }, []);

  if (loading || !user) return null;

  const isAdmin = hasRole("ADMIN");
  const isItAdmin = hasRole("IT_ADMIN") || hasRole("IT ADMIN");
  const isCalibrationManager = user.role === "CALIBRATION_MANAGER";

  const functionsToShow = ["INVENTORY_MANAGER"].includes(user.role)
    ? ["f1", "f2", "f3"]
    : user.functions?.map(f => f?.name).filter(Boolean) || [];

  const operationsToShow = ["INVENTORY_MANAGER"].includes(user.role)
    ? ["ot1", "ot2", "ot3"]
    : user.operations?.map(op => op?.name).filter(Boolean) || [];

  const departmentsToShow = ["INVENTORY_MANAGER"].includes(user.role)
    ? ["f1", "f2", "store"]
    : user.departments?.map(d => d?.name).filter(Boolean) || [];

  const toggleSection = (section) => {
    if (!isCollapsed) {
      setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    authLogout?.();
    navigate("/login");
  };

  // Close sidebar only on mobile
  const closeSidebarMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleQRScanClick = () => {
    setShowScanner(true);
    closeSidebarMobile();
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    closeSidebarMobile();
  };

  const handleChatDrawerClick = () => {
    setShowChatDrawer(true);
    closeSidebarMobile();
  };

  const handleNotificationsClick = () => {
    if (showReallocFeature) {
      setShowReallocModal(true);
      closeSidebarMobile();
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const showOperatorNotifications = (userInfo.role || "").toLowerCase().includes("operator");

  // Close sections when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setOpenSections({
        departments: false,
        functions: false,
        operations: false,
        admin: false,
        calibration: false,
      });
    }
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen 
                   bg-[#005797] border-r border-[#004a80] shadow-xl
                   transform transition-all duration-300 z-50
                   ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                   ${isCollapsed ? "w-20" : "w-72"}`}
      >
        {/* Header with logos and toggle */}
        <div className={`flex items-center ${isCollapsed ? "justify-center py-4" : "justify-between p-4"} border-b border-[#004a80] h-[80px]`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <img src={gagefxlogo} alt="App Logo" className="h-10 w-auto" /> 
                <div className="flex flex-col">
                  <span className="text-white font-thin text-lg">Lite</span>
                </div>
              </div>
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-lg bg-red-700 hover:bg-red-800 text-white transition"
                data-tooltip-id="collapse-tooltip"
                data-tooltip-content="Collapse sidebar"
              >
                <ChevronLeft size={22} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center w-50">
              <button
                onClick={toggleCollapse}
                className="p-2 rounded-lg bg-red-700 hover:bg-red-800 text-white transition w-full flex justify-center"
                data-tooltip-id="collapse-tooltip"
                data-tooltip-content="Expand sidebar"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}
        </div>

        {/* User Profile Section - only show when not collapsed */}
        {!isCollapsed && (
          <div className="p-4 border-b border-[#004a80] h-[120px]">
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-12 h-12 rounded-full bg-blue-600 overflow-hidden border-2 border-white cursor-pointer hover:border-blue-300 transition-all duration-200 hover:scale-105"
                onClick={handleProfileClick}
                data-tooltip-id="profile-image-tooltip"
                data-tooltip-content="Click to view profile"
              >
                <img
                  src={userInfo.profileImage}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{userInfo.username}</p>
                <p className="text-white/80 text-sm truncate">
                  {userInfo.role === "IT_ADMIN" ? "QC Manager" :
                   userInfo.role === "CALIBRATION_MANAGER" ? "Plant Head" :
                   userInfo.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin size={16} />
              <span className="truncate">{location}</span>
            </div>
          </div>
        )}

        {/* When collapsed, show only profile image */}
        {isCollapsed && (
          <div className="py-4 border-b border-[#004a80] flex justify-center h-[100px]">
            <div 
              className="w-12 h-12 rounded-full bg-blue-600 overflow-hidden border-2 border-white cursor-pointer hover:border-blue-300 transition-all duration-200 hover:scale-105"
              onClick={handleProfileClick}
              data-tooltip-id="profile-image-tooltip"
              data-tooltip-content={userInfo.username}
            >
              <img
                src={userInfo.profileImage}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Main navigation container with fixed height and NO scrollbars */}
        <div className={`${isCollapsed ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-300px)]"} overflow-hidden`}>
          <nav className="h-full overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-thin scrollbar-thumb-[#004a80] scrollbar-track-transparent">
            {/* Dashboard */}
            <NavLink
              to={
                user.role === "IT_ADMIN"
                  ? "/dashboard"
                  : `/dashboard/${user.role?.toLowerCase() || 'default'}`
              }
              onClick={closeSidebarMobile}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? "justify-center px-2" : "gap-4 px-4"} py-3 rounded-lg text-sm font-medium transition-all ${isActive
                  ? "bg-[#004a80] text-white shadow-md"
                  : "text-white hover:text-white hover:bg-[#004a80]"
                }`
              }
              data-tooltip-id={isCollapsed ? "dashboard-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Dashboard" : ""}
            >
              <Home size={isCollapsed ? 24 : 22} />
              {!isCollapsed && <span className="font-medium">Dashboard</span>}
            </NavLink>

            {/* Calendar */}
            <NavLink
              to="/calendar"
              onClick={closeSidebarMobile}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? "justify-center px-2" : "gap-4 px-4"} py-3 rounded-lg text-sm font-medium transition-all ${isActive
                  ? "bg-[#004a80] text-white shadow-md"
                  : "text-white hover:text-white hover:bg-[#004a80]"
                }`
              }
              data-tooltip-id={isCollapsed ? "calendar-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Calendar" : ""}
            >
              <Calendar size={isCollapsed ? 24 : 22} />
              {!isCollapsed && <span className="font-medium">Calendar</span>}
            </NavLink>



            {/* Chat */}
            <button
              onClick={handleChatDrawerClick}
              className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} w-full py-3 rounded-lg text-sm transition-all text-white hover:bg-[#004a80] cursor-pointer`}
              data-tooltip-id={isCollapsed ? "chat-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Chat" : ""}
            >
              <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-4"}`}>
                <MessageCircle size={isCollapsed ? 24 : 22} />
                {!isCollapsed && <span className="font-medium">Chat</span>}
              </div>
              {!isCollapsed && unreadCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* System Notifications */}
            <button
              onClick={() => {
                setShowNotificationPanel(true);
                closeSidebarMobile();
              }}
              className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} w-full py-3 rounded-lg text-sm transition-all text-white hover:bg-[#004a80] cursor-pointer relative`}
              data-tooltip-id={isCollapsed ? "system-notifications-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Notifications" : ""}
            >
              <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-4"}`}>
                <Bell size={isCollapsed ? 24 : 22} />
                {!isCollapsed && <span className="font-medium">Notifications</span>}
              </div>
              
              {/* Show count badge if there are unread notifications */}
              {!isCollapsed && systemNotificationsCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold animate-pulse">
                  {systemNotificationsCount > 9 ? '9+' : systemNotificationsCount}
                </span>
              )}
              
              {/* For collapsed state, show a small dot */}
              {isCollapsed && systemNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center animate-ping"></span>
              )}
            </button>

            {/* QR Scanner */}
            <button
              onClick={handleQRScanClick}
              className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-4 px-4"} w-full py-3 rounded-lg text-sm transition-all text-white hover:bg-[#004a80] cursor-pointer`}
              data-tooltip-id={isCollapsed ? "qr-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Scan Gage" : ""}
            >
              <QrCode size={isCollapsed ? 24 : 22} />
              {!isCollapsed && <span className="font-medium">Scan Gage</span>}
            </button>

            {/* Reallocation Requests - HOD only */}
            {/* <button
              onClick={handleNotificationsClick}
              disabled={!showReallocFeature}
              className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} w-full py-3 rounded-lg text-sm transition-all ${showReallocFeature ? "text-white hover:bg-[#004a80] cursor-pointer" : "text-white/60 cursor-not-allowed"}`}
              data-tooltip-id={isCollapsed ? "realloc-tooltip" : ""}
              data-tooltip-content={isCollapsed ? "Reallocation Requests" : ""}
            >
              <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-4"}`}>
                <Bell size={isCollapsed ? 24 : 22} />
                {!isCollapsed && <span className="font-medium">Reallocation Requests</span>}
              </div>
              {!isCollapsed && showReallocFeature && hodNotificationCount > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold">
                  {hodNotificationCount}
                </span>
              )}
            </button> */}

            {/* Operator Notifications */}
            {showOperatorNotifications && (
              <button
                onClick={() => {
                  setShowOperatorNotificationModal(true);
                  closeSidebarMobile();
                }}
                className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} w-full py-3 rounded-lg text-sm transition-all text-white hover:bg-[#004a80] cursor-pointer`}
                data-tooltip-id={isCollapsed ? "operator-notif-tooltip" : ""}
                data-tooltip-content={isCollapsed ? "My Notifications" : ""}
              >
                <div className={`flex items-center ${isCollapsed ? "gap-0" : "gap-4"}`}>
                  <Bell size={isCollapsed ? 24 : 22} />
                  {!isCollapsed && <span className="font-medium">My Notifications</span>}
                </div>
                {!isCollapsed && operatorNotificationCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full min-w-[22px] h-5 flex items-center justify-center text-[10px] font-bold">
                    {operatorNotificationCount}
                  </span>
                )}
              </button>
            )}


            {/* Collapsed admin icons */}
            {(isAdmin || isItAdmin || isCalibrationManager) && isCollapsed && (
              <div className="space-y-1">
                <NavLink
                  to="/dashboard"
                  onClick={closeSidebarMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-center py-3 px-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#004a80] text-white shadow-md" : "text-white hover:text-white hover:bg-[#004a80]"}`
                  }
                  data-tooltip-id="admin-dashboard-tooltip"
                >
                </NavLink>
                
                {isItAdmin && (
                  <NavLink
                    to="/admin/calibration"
                    onClick={closeSidebarMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-center py-3 px-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#004a80] text-white shadow-md" : "text-white hover:text-white hover:bg-[#004a80]"}`
                    }
                    data-tooltip-id="calibration-tooltip"
                    data-tooltip-content="Calibration"
                  >
                    <Ruler size={24} />
                  </NavLink>
                )}
              </div>
            )}

            {/* Admin/Inventory Management - only when expanded */}
            {(isAdmin || isItAdmin || isCalibrationManager) && !isCollapsed && (
              <>
                {!isItAdmin && (
                  <button
                    onClick={() => toggleSection("admin")}
                    className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white hover:text-white transition-colors hover:bg-[#004a80] rounded-lg"
                  >
                    <span className="flex items-center gap-4">
                      <Shield size={22} />
                      <span className="font-medium">Inventory Management</span>
                    </span>
                    {openSections.admin ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                )}

                {openSections.admin && (
                  <div className="mt-1 space-y-1 pl-12">
                    {isItAdmin || isCalibrationManager && (
                      <>
                        <NavLink to="/it-admin/users" onClick={closeSidebarMobile} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                          <Users size={18} /> <span>Users</span>
                        </NavLink>
                        <NavLink to="/it-admin/departments" onClick={closeSidebarMobile} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                          <Building2 size={18} /> <span>Departments</span>
                        </NavLink>
                        <NavLink to="/it-admin/functions" onClick={closeSidebarMobile} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                          <Workflow size={18} /> <span>Functions</span>
                        </NavLink>
                        <NavLink to="/it-admin/operations" onClick={closeSidebarMobile} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                          <Settings size={18} /> <span>Operations</span>
                        </NavLink>
                        <NavLink to="/it-admin/roles" onClick={closeSidebarMobile} className={({ isActive }) => `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                          <Shield size={18} /> <span>Roles</span>
                        </NavLink>
                      </>
                    )}
                  </div>
                )}

                {isItAdmin && (
                  <div className="space-y-1">
                    <NavLink
                      to="/admin/calibration"
                      onClick={closeSidebarMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-4 py-3 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#004a80]"}`
                      }
                    >
                      <Ruler size={22} /> <span className="font-medium">Calibration Manager</span>
                    </NavLink>
                  </div>
                )}
              </>
            )}

            {/* Calibration Manager - only when expanded */}
            {isCalibrationManager && !isCollapsed && (
              <div className="mt-3">
                <button
                  onClick={() => toggleSection("calibration")}
                  className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white hover:text-white transition-colors hover:bg-[#004a80] rounded-lg"
                >
                  <span className="flex items-center gap-4">
                    <Ruler size={22} />
                    <span className="font-medium">Calibration</span>
                  </span>
                  {openSections.calibration ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {openSections.calibration && (
                  <div className="mt-1 space-y-1 pl-12">
                    <NavLink
                      to="/admin/calibration"
                      onClick={closeSidebarMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-3 py-2 px-4 rounded text-sm transition-all ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`
                      }
                    >
                      <Ruler size={18} /> <span>Calibration Management</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}

            {/* Departments - only show when expanded */}
            {!isCalibrationManager && !isCollapsed && departmentsToShow.length > 0 && (
              <div className="mt-3">
                <button onClick={() => toggleSection("departments")} className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white hover:text-white transition-colors hover:bg-[#004a80] rounded-lg">
                  <span className="flex items-center gap-4"><Building2 size={22} /> <span className="font-medium">DEPARTMENTS</span></span>
                  {openSections.departments ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {openSections.departments && (
                  <div className="mt-1 space-y-1 pl-12">
                    {departmentsToShow.map(d => (
                      <NavLink key={d} to={`/departments/${d}`} onClick={closeSidebarMobile} className={({ isActive }) => `block py-2 px-4 rounded-lg text-sm transition-all capitalize ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                        {d}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Functions - only show when expanded */}
            {!isCalibrationManager && !isCollapsed && functionsToShow.length > 0 && (
              <div className="mt-3">
                <button onClick={() => toggleSection("functions")} className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white hover:text-white transition-colors hover:bg-[#004a80] rounded-lg">
                  <span className="flex items-center gap-4"><Workflow size={22} /> <span className="font-medium">FUNCTIONS</span></span>
                  {openSections.functions ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {openSections.functions && (
                  <div className="mt-1 space-y-1 pl-12">
                    {functionsToShow.map(f => (
                      <NavLink key={f} to={`/functions/${f}`} onClick={closeSidebarMobile} className={({ isActive }) => `block py-2 px-4 rounded text-sm transition-all uppercase ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                        {f}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Operations - only show when expanded */}
            {!isCalibrationManager && !isCollapsed && operationsToShow.length > 0 && (
              <div className="mt-3">
                <button onClick={() => toggleSection("operations")} className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white hover:text-white transition-colors hover:bg-[#004a80] rounded-lg">
                  <span className="flex items-center gap-4"><Settings size={22} /> <span className="font-medium">OPERATIONS</span></span>
                  {openSections.operations ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {openSections.operations && (
                  <div className="mt-1 space-y-1 pl-12">
                    {operationsToShow.map(op => (
                      <NavLink key={op} to={`/operations/${op}`} onClick={closeSidebarMobile} className={({ isActive }) => `block py-2 px-4 rounded text-sm transition-all uppercase ${isActive ? "bg-[#004a80] text-white" : "text-white hover:text-white hover:bg-[#003a70]"}`}>
                        {op}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Collapsed department/function icons */}
            {!isCalibrationManager && isCollapsed && (
              <>
                {departmentsToShow.length > 0 && (
                  <NavLink
                    to="/departments"
                    onClick={closeSidebarMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-center py-3 px-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#004a80] text-white shadow-md" : "text-white hover:text-white hover:bg-[#004a80]"}`
                    }
                    data-tooltip-id="departments-tooltip"
                    data-tooltip-content="Departments"
                  >
                    <Building2 size={24} />
                  </NavLink>
                )}
                {functionsToShow.length > 0 && (
                  <NavLink
                    to="/functions"
                    onClick={closeSidebarMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-center py-3 px-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#004a80] text-white shadow-md" : "text-white hover:text-white hover:bg-[#004a80]"}`
                    }
                    data-tooltip-id="functions-tooltip"
                    data-tooltip-content="Functions"
                  >
                    <Workflow size={24} />
                  </NavLink>
                )}
                {operationsToShow.length > 0 && (
                  <NavLink
                    to="/operations"
                    onClick={closeSidebarMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-center py-3 px-2 rounded-lg text-sm transition-all ${isActive ? "bg-[#004a80] text-white shadow-md" : "text-white hover:text-white hover:bg-[#004a80]"}`
                    }
                    data-tooltip-id="operations-tooltip"
                    data-tooltip-content="Operations"
                  >
                    <Settings size={24} />
                  </NavLink>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Footer with Time and Logout - FIXED HEIGHT */}
        <div className={`${isCollapsed ? "h-[100px]" : "h-[120px]"} border-t border-[#004a80]`}>
          <div className={`h-full flex ${isCollapsed ? "flex-col items-center justify-center gap-3 p-3" : "flex-col justify-between p-6"}`}>
            {!isCollapsed ? (
              <>
                <div className="flex justify-center items-center">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="group relative flex items-center gap-3 px-5 py-2.5 rounded-lg 
                             bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 
                             text-white font-medium text-sm shadow-md hover:shadow-lg 
                             transition-all duration-300 ease-in-out transform hover:-translate-y-0.5
                             active:scale-95 w-full justify-center"
                    data-tooltip-id="logout-tooltip"
                    data-tooltip-content="Logout from system"
                  >
                    <LogOut
                      size={18}
                      className="transition-transform duration-300 group-hover:rotate-12"
                    />
                    <span className="whitespace-nowrap">Logout</span>
                    <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </button>
                </div>
                <div className="text-center text-white/50 text-xs">
                  <div className="font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-1">|</span>
                     {currentTime.toLocaleDateString()}</div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="group relative p-3 rounded-xl bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 
                           text-white shadow-md hover:shadow-lg 
                           transition-all duration-300 ease-in-out
                           active:scale-95"
                  data-tooltip-id="logout-tooltip"
                  data-tooltip-content="Logout"
                >
                  <LogOut
                    size={22}
                    className="transition-transform duration-300 group-hover:rotate-12"
                  />
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </button>
                
                <div className="text-center text-white/50 text-xs mt-2">
                  <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile close button */}
        {isSidebarOpen && window.innerWidth < 1024 && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute -right-12 top-4 p-3 bg-[#005797] text-white rounded-r-lg shadow-lg hover:bg-[#004a80] transition lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        )}
      </aside>

      {/* ✅ SYSTEM NOTIFICATIONS PANEL */}
      {showNotificationPanel && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[60]" 
            onClick={() => setShowNotificationPanel(false)}
          />
          <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-xl z-[61] overflow-hidden">
            <NotificationManager onClose={() => setShowNotificationPanel(false)} />
          </div>
        </>
      )}

      {/* ✅ QR SCANNER MODAL */}
      {showScanner && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowScanner(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="relative">
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-3 right-3 z-10 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition"
                aria-label="Close scanner"
              >
                <X size={24} />
              </button>
              <div className="p-1">
                <GageScanner onClose={() => setShowScanner(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ PROFILE MODAL */}
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* ✅ CHAT DRAWER */}
      <ChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        username={username}
        setUnreadCount={setUnreadCount}
      />

      {/* ✅ REALLOCATION MODAL */}
      {showReallocFeature && (
        <ReallocationManagementModal
          isOpen={showReallocModal}
          onClose={() => setShowReallocModal(false)}
          onRefresh={fetchHodNotificationCount}
        />
      )}

      {/* ✅ OPERATOR NOTIFICATION MODAL */}
      {showOperatorNotificationModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[55] p-4"
          onClick={() => setShowOperatorNotificationModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">Your Notifications</h3>
              <button
                onClick={() => setShowOperatorNotificationModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-grow">
              <OperatorReallocationNotifications operatorUsername={userInfo.username} />
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="relative p-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 bg-red-50 p-4 rounded-full ring-1 ring-red-200">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Confirm Logout</h2>
              </div>
              <div className="flex justify-center gap-4 pb-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltips for collapsed state */}
      <Tooltip id="collapse-tooltip" place="right" />
      <Tooltip id="dashboard-tooltip" place="right" />
      <Tooltip id="calendar-tooltip" place="right" />
      <Tooltip id="chat-tooltip" place="right" />
      <Tooltip id="system-notifications-tooltip" place="right" />
      <Tooltip id="qr-tooltip" place="right" />
      <Tooltip id="realloc-tooltip" place="right" />
      <Tooltip id="operator-notif-tooltip" place="right" />
      <Tooltip id="admin-dashboard-tooltip" place="right" />
      <Tooltip id="calibration-tooltip" place="right" />
      <Tooltip id="departments-tooltip" place="right" />
      <Tooltip id="functions-tooltip" place="right" />
      <Tooltip id="operations-tooltip" place="right" />
      <Tooltip id="profile-image-tooltip" place="right" />
      <Tooltip id="logout-tooltip" place="top" />
    </>
  );
}