import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import gagfxlogo from "../../assets/GageFX  Long.png";
import companyLogo from "../../assets/HTF.png"; // ✅ Added company logo import
import profileLogo from "../../assets/profile1.jpg"; // ✅ Added profile logo import
import {
  Calendar,
  Bell,
  HelpCircle,
  User,
  MapPin,
  LogOut,
  Settings,
  Menu,
  MessageCircle,
  X,
  QrCode, // ✅ Added QR Code icon
} from "lucide-react";
import { MessagesSquare } from 'lucide-react';
import { useAuth } from "../../auth/AuthContext";
//import TimeoutSettings from "../TimeoutSettings";
import api from "../../api/axios";
import ProfileModal from "./Profile";
import ChatDrawer from "../forum/ChatDrawer";
import ReallocationManagementModal from '../../Components/ReallocationManagementModal';
import { getReallocatesByStatus } from "../../api/api";
import OperatorReallocationNotifications from "../Operator/OperatorReallocationNotifications";
import { Tooltip } from "react-tooltip";
import GageScanner from '../Layout/GageScanner'; // ✅ Import QR Scanner

// 🔊 Generate a short beep sound (no external file needed)
const generateBeepSound = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = 1000; // Lower pitch (e.g., 400–1000 Hz)
  oscillator.type = 'sine';  // Try 'square', 'sawtooth', or 'triangle' for richer tones
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

export default function Navbar({ showTitle = true, isSidebarOpen, setSidebarOpen }) {
  const [location, setLocation] = useState("Fetching location...");
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [userInfo, setUserInfo] = useState({ 
    username: "", 
    role: "", 
    profileImage: "" 
  });
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth() ?? {};
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Chat drawer visibility
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Reallocation Modal and Notification Count (for HODs)
  const [hodNotificationCount, setHodNotificationCount] = useState(0); // Renamed for clarity
  const [showReallocModal, setShowReallocModal] = useState(false);

  // Operator-specific Notification Count (UPDATED)
  const [operatorNotificationCount, setOperatorNotificationCount] = useState(0);

  // 🔊 Sound toggle state
  const [isMuted, setIsMuted] = useState(false);

  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ✅ NEW STATE: Control visibility of Operator Notification Modal
  const [showOperatorNotificationModal, setShowOperatorNotificationModal] = useState(false);

  // ✅ NEW STATE: QR Scanner Modal
  const [showScanner, setShowScanner] = useState(false);

  const username = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")).username
    : null;

  // Derive role robustly from stored user object (supports nested formats)
  const getRoleString = (stored) => {
    try {
      if (!stored) return "";
      const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
      const userObj = parsed.user || parsed.data || parsed.result || parsed;
      if (!userObj) return "";
      if (userObj.role) return typeof userObj.role === "string" ? userObj.role : userObj.role.name || "";
      if (userObj.roles && Array.isArray(userObj.roles) && userObj.roles[0]) {
        return typeof userObj.roles[0] === "string" ? userObj.roles[0] : userObj.roles[0].name || "";
      }
      return "";
    } catch (err) {
      return "";
    }
  };

  const storedRaw = localStorage.getItem("user");
  const derivedRole = getRoleString(storedRaw).toString();

  // Determine if current user is an operator (based on role or other logic)
  const showOperatorNotifications = (derivedRole || userInfo.role || "")
    .toString()
    .toLowerCase()
    .includes("operator"); // Adjust role check as needed

  // Only show reallocation-management features to Plant HOD-like roles
  const showReallocFeature = (derivedRole || userInfo.role || "").toString().toLowerCase().includes("hod") ||
    (derivedRole || userInfo.role || "").toString().toLowerCase().includes("plant_hod") ||
    (derivedRole || userInfo.role || "").toString().toLowerCase().includes("planthod");

  // Load user info from localStorage
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
      // ✅ ALWAYS use the imported profile image
      const profileImage = profileLogo; // Always use the local asset

      setUserInfo({
        username: usernameStr,
        role: roleStr || "User",
        profileImage: profileImage, // This will always be the local asset
      });
    } catch (err) {
      console.warn("Failed to parse stored user for Navbar:", err?.message || err);
      // Set default with local asset
      setUserInfo({
        username: "Guest",
        role: "User",
        profileImage: profileLogo,
      });
    }
  }, []);

  // Fetch live location
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

  // Store previous counts to detect NEW notifications
  const prevHodNotificationCountRef = useRef(hodNotificationCount);
  const prevOperatorNotificationCountRef = useRef(operatorNotificationCount);

  // Fetch HOD notification count (pending reallocates) only for Plant HOD
  useEffect(() => {
    if (showReallocFeature) {
      fetchHodNotificationCount();
    } else {
      setHodNotificationCount(0);
    }
  }, [showReallocFeature]);

  const fetchHodNotificationCount = async () => {
    try {
      const pendingReallocates = await getReallocatesByStatus('PENDING_APPROVAL');
      setHodNotificationCount(pendingReallocates.length || 0);
    } catch (err) {
      console.error('Error fetching HOD notification count:', err);
      setHodNotificationCount(0);
    }
  };

  // Fetch Operator notification count (UPDATED) - Uses live API and filters by notes
  useEffect(() => {
    if (showOperatorNotifications) {
      fetchOperatorNotificationCount();
    } else {
      setOperatorNotificationCount(0);
    }
  }, [showOperatorNotifications, userInfo.username]); // Add userInfo.username as dependency

  const fetchOperatorNotificationCount = async () => {
    try {
      // Fetch relevant statuses that indicate a notification-worthy event for the operator
      // Use Promise.allSettled to handle potential failures of individual status requests gracefully
      // ✅ REPLACED 'REJECTED' with 'CANCELLED'
      const [approvedResult, cancelledResult, returnedResult] = await Promise.allSettled([
        getReallocatesByStatus('APPROVED'),
        getReallocatesByStatus('CANCELLED'), // Changed from 'REJECTED'
        getReallocatesByStatus('RETURNED')
      ]);

      let allReallocations = [];

      // Check results and add successful data to allReallocations
      if (approvedResult.status === 'fulfilled') {
        allReallocations.push(...approvedResult.value);
      } else {
        console.error('Failed to fetch APPROVED reallocates:', approvedResult.reason);
      }

      // ✅ REPLACED 'rejectedResult' with 'cancelledResult'
      if (cancelledResult.status === 'fulfilled') {
        allReallocations.push(...cancelledResult.value);
      } else {
        console.error('Failed to fetch CANCELLED reallocates:', cancelledResult.reason);
        // Optional: Show a UI indicator or log if needed, but don't break the whole process
      }

      if (returnedResult.status === 'fulfilled') {
        allReallocations.push(...returnedResult.value);
      } else {
        console.error('Failed to fetch RETURNED reallocates:', returnedResult.reason);
      }

      // Filter the combined data based on the 'notes' field containing the operator's username
      // This matches the format stored by the HOD: "Notify Operator: {username}"
      const filteredNotifications = allReallocations
        .filter(r => r.notes && r.notes.includes(`Notify Operator: ${userInfo.username}`))
        .map(r => ({
          id: r.id,
          reallocateId: r.id,
          gageSerialNumber: r.gageSerialNumber,
          gageTypeName: r.gageTypeName,
          status: r.status,
          message: r.status === 'APPROVED' ? `Your request for ${r.gageSerialNumber} has been APPROVED.` :
            // ✅ REPLACED 'REJECTED' with 'CANCELLED' in the message
            r.status === 'CANCELLED' ? `Your request for ${r.gageSerialNumber} has been CANCELLED.` :
              r.status === 'RETURNED' ? `${r.gageSerialNumber} has been returned.` :
                `Status update for ${r.gageSerialNumber}.`,
          timestamp: r.approvedAt || r.cancelledAt || r.returnedAt || r.updatedAt, // Use appropriate timestamp, e.g., cancelledAt
          read: r.acknowledgedByOperator || false, // Assuming a field tracks if operator saw it
          type: r.status.toLowerCase().replace('_', ''), // e.g., 'reallocation_approved'
          relatedData: {
            newDepartment: r.currentDepartment,
            newFunction: r.currentFunction,
            newOperation: r.currentOperation,
            notes: r.notes,
            reason: r.status === 'CANCELLED' ? r.notes : r.status === 'RETURNED' ? r.returnReason : undefined
          }
        }));

      // Count only unacknowledged notifications (or all if no acknowledged field)
      const unacknowledgedCount = filteredNotifications.filter(n => !n.read).length;
      setOperatorNotificationCount(unacknowledgedCount);
      console.log(`Operator notification count updated to: ${unacknowledgedCount}`); // Debug log

    } catch (err) {
      console.error('Error fetching operator notification count (outer catch):', err);
      // This catch is less likely now with Promise.allSettled, but still good practice
      setOperatorNotificationCount(0); // Reset count on unexpected error
    }
  };

  // 🔊 Play sound ONCE PER NEW notification (for both HOD and Operator)
  useEffect(() => {
    const prevHodCount = prevHodNotificationCountRef.current;
    const newHodCount = hodNotificationCount;

    if (
      showReallocFeature && // Only for HODs
      !isMuted &&
      newHodCount > prevHodCount &&
      newHodCount > 0
    ) {
      const newHodNotifications = newHodCount - prevHodCount;
      for (let i = 0; i < newHodNotifications; i++) {
        setTimeout(() => {
          generateBeepSound();
        }, i * 600);
      }
    }

    const prevOpCount = prevOperatorNotificationCountRef.current;
    const newOpCount = operatorNotificationCount;

    if (
      showOperatorNotifications && // Only for Operators
      !isMuted &&
      newOpCount > prevOpCount &&
      newOpCount > 0
    ) {
      const newOpNotifications = newOpCount - prevOpCount;
      for (let i = 0; i < newOpNotifications; i++) {
        setTimeout(() => {
          generateBeepSound();
        }, i * 600);
      }
    }

    prevHodNotificationCountRef.current = newHodCount;
    prevOperatorNotificationCountRef.current = newOpCount;
  }, [hodNotificationCount, operatorNotificationCount, showReallocFeature, showOperatorNotifications, isMuted]);

  // Poll for new HOD notifications every 30 seconds (only for HOD users)
  useEffect(() => {
    if (!showReallocFeature) return;

    const intervalId = setInterval(() => {
      fetchHodNotificationCount();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [showReallocFeature]);

  // Poll for new Operator notifications every 30 seconds (only for Operators) (UPDATED)
  useEffect(() => {
    if (!showOperatorNotifications) return;

    const intervalOpId = setInterval(() => {
      fetchOperatorNotificationCount();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalOpId);
  }, [showOperatorNotifications, userInfo.username]); // Add userInfo.username as dependency

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("redirectPath");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");

    // Clear any pending timeouts or intervals
    if (window.authTimeout) {
      clearTimeout(window.authTimeout);
    }

    // Call logout from context if available
    logout?.();

    // Close sidebar
    setSidebarOpen?.(false);

    // Force navigation to /login without any redirect parameters
    window.location.href = "/login"; // ✅ COMPLETE PAGE RELOAD TO CLEAR ALL STATE
  };

  // ✅ Handle QR Scanner Click
  const handleQRScanClick = () => {
    setShowScanner(true);
  };

  // ✅ Handle Chat Drawer Click
  const handleChatDrawerClick = () => {
    setShowChatDrawer(true);
  };

  // Shake and Fade animations
  const animations = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-3px); }
      75% { transform: translateX(3px); }
    }
    .animate-shake {
      animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) infinite;
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-fade-in-scale {
      animation: fadeInScale 0.3s ease-out;
    }
  `;

  return (
    <>
      <style>{animations}</style>
      <nav className="fixed top-0 left-0 right-0 bg-[#005797] text-white px-6 py-3 flex justify-between items-center shadow-lg w-full z-50">
        {/* Left: Sidebar Toggle + Logos */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen?.(!isSidebarOpen)}
            className={`p-2 rounded-md transition inline-flex items-center justify-center
              ${isSidebarOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            <Menu size={20} />
          </button>

          
          <img src={gagfxlogo} alt="App Logo" className="h-12 w-18" />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* ✅ Chart Icon - Opens Chat Drawer */}
          <button
            onClick={handleChatDrawerClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md transition hover:bg-blue-600 hover:text-white cursor-pointer relative"
            data-tooltip-id="chat-tooltip"
            data-tooltip-content="Open Chat"
          >
            <MessageCircle size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* ✅ QR Code Scanner Button */}
          <button
            onClick={handleQRScanClick}
            className="flex items-center gap-2 px-3 py-2 rounded-md transition hover:bg-blue-600 hover:text-white cursor-pointer"
            data-tooltip-id="qr-scanner"
            data-tooltip-content="Scan QR Code"
          >
            <QrCode size={18} />
          </button>

          {/* Calendar */}
          <NavLink
            to="/calendar"
            onClick={() => setSidebarOpen?.(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md transition ${isActive
                ? "bg-white text-blue-800 font-semibold"
                : "hover:bg-blue-600 hover:text-white"
              }`
            }
          >
            <Calendar size={18} />
          </NavLink>

          {/* 🔔 First Notification Bell - Help/General */}
          <div className="relative cursor-pointer p-2">
            <Bell
              className="w-7 h-7 text-gray-300 hover:text-white transition"
              data-tooltip-id="help-bell"
              data-tooltip-content="General notifications"
            />
          </div>

          {/* 🔔 HOD Notifications with Mute Toggle */}
          {showReallocFeature && (
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setShowReallocModal(true)}
                className="relative cursor-pointer"
                data-tooltip-id="realloc-bell"
                data-tooltip-content="Reallocation requests pending approval"
              >
                <Bell className={`w-7 h-7 text-gray-300 hover:text-white transition ${hodNotificationCount > 0 ? 'animate-shake' : ''}`} />
                {hodNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-xs rounded-full px-1">
                    {hodNotificationCount}
                  </span>
                )}
              </button>
              {/* 🔇 Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-md text-gray-300 hover:text-white transition"
                data-tooltip-id="mute-tooltip"
                data-tooltip-content={isMuted ? "Unmute notifications" : "Mute notifications"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
          )}

          {/* 🔔 Operator Notifications (UPDATED) */}
          {showOperatorNotifications && (
            <div className="relative flex items-center gap-1">
              <button
                // ✅ MODIFIED: Open the actual notification modal instead of alert
                onClick={() => {
                  setShowOperatorNotificationModal(true);
                  // Optional: Reset the count when the modal is opened/viewed
                  // setOperatorNotificationCount(0); // This only resets the UI count, not the backend status
                }}
                className="relative cursor-pointer"
                data-tooltip-id="operator-bell"
                data-tooltip-content="Your notifications"
              >
                <Bell className={`w-7 h-7 text-gray-300 hover:text-white transition ${operatorNotificationCount > 0 ? 'animate-shake' : ''}`} />
                {operatorNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-xs rounded-full px-1">
                    {operatorNotificationCount}
                  </span>
                )}
              </button>
            </div>
          )}
          {/* ✅ Company Logo Added */}
          <img src={companyLogo} alt="Company Logo" className="h-10 w-auto" />
          <div className="relative flex items-center space-x-2" ref={userMenuRef}>
            <div
              onClick={() => setOpenUserMenu(!openUserMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 cursor-pointer hover:bg-blue-700 transition overflow-hidden border-2 border-white"
            >
              {/* ✅ ALWAYS use the imported profile image */}
              <img
                src={profileLogo}
                alt="avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <span className="text-gray-200 font-medium">
              {userInfo.role === "IT_ADMIN"
                ? "QC Manager"
                : userInfo.role === "CALIBRATION_MANAGER"
                  ? "Plant Head"
                  : userInfo.role}
            </span>

            {openUserMenu && (
              <div className="absolute right-0 mt-12 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setOpenUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="w-4 h-4 mr-2 text-gray-500" /> Profile
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    setOpenUserMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2 text-red-500" /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Profile Modal */}
          <ProfileModal
            open={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            // Remove onUpdated prop since we're not changing profile image
          />

          {/* Logout/Login */}
          {user ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded-md text-sm font-semibold shadow-md"
            >
              LOGOUT
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setSidebarOpen?.(false)}
              className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded-md text-sm font-semibold shadow-md"
            >
              LOGIN
            </Link>
          )}
        </div>
      </nav>

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

      {/* ✅ Chat Drawer */}
      <ChatDrawer
        isOpen={showChatDrawer}
        onClose={() => setShowChatDrawer(false)}
        username={username}
        setUnreadCount={setUnreadCount}
      />

      {/* ✅ NEW: Operator Notification Modal/Drawer */}
      {showOperatorNotifications && showOperatorNotificationModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55] p-4"
          onClick={() => setShowOperatorNotificationModal(false)} // Close modal when clicking the backdrop
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
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
              {/* ✅ Pass the operator's username to the notification component */}
              <OperatorReallocationNotifications operatorUsername={userInfo.username} />
            </div>
          </div>
        </div>
      )}

      {/* Reallocation Management Modal */}
      {showReallocFeature && (
        <ReallocationManagementModal
          isOpen={showReallocModal}
          onClose={() => setShowReallocModal(false)}
          onRefresh={fetchHodNotificationCount} // Pass the correct refresh function
        />
      )}

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-scale transform transition-all">
            <div className="relative p-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-100"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 bg-red-50 p-4 rounded-full ring-1 ring-red-200">
                  <LogOut className="w-8 h-8 text-red-500" />
                </div>
                <h2 id="logout-title" className="text-2xl font-semibold text-gray-800 mb-2">Confirm Logout</h2>
                <p className="text-gray-500 mb-6 max-w-xs">Are you sure you want to log out? You'll need to sign in again to continue using the app.</p>
              </div>
              <div className="flex justify-center gap-4 pb-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md hover:shadow-lg"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Chat Tooltip */}
      <Tooltip
        id="chat-tooltip"
        place="bottom"
        style={{
          backgroundColor: 'black',
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />

      {/* ✅ QR Scanner Tooltip */}
      <Tooltip
        id="qr-scanner"
        place="bottom"
        style={{
          backgroundColor: 'black',
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />

      {/* ✅ Help Notification Tooltip */}
      <Tooltip
        id="help-bell"
        place="bottom"
        style={{
          backgroundColor: 'black',
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />

      {/* Operator Notification Tooltip */}
      <Tooltip
        id="operator-bell"
        place="bottom"
        style={{
          backgroundColor: 'black',
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />

      {/* Mute Tooltip */}
      <Tooltip
        id="mute-tooltip"
        place="bottom"
        style={{
          backgroundColor: 'black', // indigo-600
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />

      {/* Reallocation Bell Tooltip */}
      <Tooltip
        id="realloc-bell"
        place="bottom"
        style={{
          backgroundColor: 'black', // indigo-600
          color: 'white',
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          zIndex: 50,
        }}
      />
    </>
  );
}