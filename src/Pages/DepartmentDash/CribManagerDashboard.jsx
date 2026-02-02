//cribmanagerdashboard.jsx
import React, { useState, useEffect } from "react";
import IssueGageForm from "./IssueGageForm"; // Adjust path
import { ClipboardCheck } from "lucide-react";
import { FaSearch } from "react-icons/fa";
import {
  getGages,
  getGageBySerial,
  listGageIssues,
  countGageIssues,
  createGageIssue
} from "../../api/api"; // adjust path
import { Package, FileText, BarChart2 } from "lucide-react";



 
// Sample data (replace with real API calls)
const storeRankData = [
  { rank: 1, name: "385 Clayton", nps: 86.3, change: 4 },
  { rank: 2, name: "937 University City Mall", nps: 86.3, change: 1 },
  { rank: 8, name: "350 Brentwood Promenade", nps: 71.3, change: 2 },
  { rank: 16, name: "239 Shops at Laura Hill", nps: 46.3, change: -3 },
  { rank: 17, name: "19 Glendale Town Center", nps: 46.3, change: -7 },
];
 
const casesData = [
  {
    title: "Machine Breakdown in Production Line",
    description:
      "One of the CNC machines stopped working during shift. Production is halted until maintenance is completed.",
    priority: "High Priority",
    due: "22/08/2025",
    images: ["/images/machine-breakdown.png"],
  },
  {
    title: "Worker Safety Concern",
    description:
      "Employee reported that safety guard on Press Machine #3 is loose and could cause accidents if not fixed immediately.",
    priority: "Critical Priority",
    due: "22/08/2025",
    images: ["/images/safety-guard.png"],
  },
  {
    title: "Raw Material Shortage",
    description:
      "Insufficient supply of steel coils for upcoming batch. Vendor delay reported, alternative sourcing required.",
    priority: "Medium Priority",
    due: "23/08/2025",
  },
  {
    title: "Quality Inspection Failure",
    description:
      "Batch #245 failed internal QC due to surface defects. Needs root cause analysis and corrective action.",
    priority: "High Priority",
    due: "23/08/2025",
    images: ["/images/quality-failure.png"],
  },
  {
    title: "IT System Downtime",
    description:
      "ERP server went offline during production scheduling. Causing delays in order processing and reporting.",
    priority: "Medium Priority",
    due: "22/08/2025",
    images: ["/images/server-down.png"],
  },
  {
    title: "Safety Gear Non-Compliance",
    description:
      "Two workers entered welding area without protective face shields. Immediate training required.",
    priority: "Critical Priority",
    due: "22/08/2025",
    images: ["/images/safety-violation1.png", "/images/safety-violation2.png"],
  },
];
 
 
 
export default function CribManagerDashboard() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [npsProgress, setNpsProgress] = useState(0);
  const [expandedCase, setExpandedCase] = useState(null);
 
  // Drawers
const [showAvailableGages, setShowAvailableGages] = useState(false);
const [showIssuedGages, setShowIssuedGages] = useState(false);
 
// Backend data
const [availableGages, setAvailableGages] = useState([]);
const [issuedGages, setIssuedGages] = useState([]);
 
// Loading states (optional)
const [loadingAvailable, setLoadingAvailable] = useState(false);
const [loadingIssued, setLoadingIssued] = useState(false);
 
 
  // Search filters
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchIssued, setSearchIssued] = useState("");
  const [gageStats, setGageStats] = useState({
  total: 0,
  active: 0,
  issued: 0,
  calibrationDue: 0,
  retired: 0,
});
const [gageTypeStats, setGageTypeStats] = useState([]);
const [showAllTypes, setShowAllTypes] = useState(false);
 
useEffect(() => {
  const fetchData = async () => {
    try {
      const allGages = await getGages();
      const issuedList = await listGageIssues();
      const issuedSerials = new Set(issuedList.map(i => i.serialNumber));
 
      // Compute available: not issued AND not retired
      const active = allGages.filter(g => {
        const isIssued = issuedSerials.has(g.serialNumber);
        const isRetired = g.status?.toLowerCase() === 'retired';
        const isCalibrationDue = g.nextCalibrationDate
          ? new Date(g.nextCalibrationDate) < new Date()
          : false;
 
        // Active = not issued, not retired, and not calibration-due (or treat cal-due as active but flagged)
        return !isIssued && !isRetired;
      });
 
      const issued = allGages.filter(g => issuedSerials.has(g.serialNumber));
      const retired = allGages.filter(g => g.status?.toLowerCase() === 'retired');
      const calibrationDue = allGages.filter(g =>
        g.nextCalibrationDate && new Date(g.nextCalibrationDate) < new Date()
      );
 
      setAvailableGages(active);
      setIssuedGages(issued);
      setGageStats({
        total: allGages.length,
        active: active.length,
        issued: issued.length,
        calibrationDue: calibrationDue.length,
        retired: retired.length,
      });
      // Group by gage type
const typeMap = {};
 
allGages.forEach(g => {
  const typeName = g.gageType?.name || "Unknown";
  if (!typeMap[typeName]) {
    typeMap[typeName] = {
      name: typeName,
      active: 0,
      issued: 0,
      calibrationDue: 0,
      retired: 0,
      total: 0
    };
  }
 
  const isIssued = issuedSerials.has(g.serialNumber);
  const isRetired = g.status?.toLowerCase() === 'retired';
  const isCalibrationDue = g.nextCalibrationDate
    ? new Date(g.nextCalibrationDate) < new Date()
    : false;
 
  if (isRetired) {
    typeMap[typeName].retired++;
  } else if (isIssued) {
    typeMap[typeName].issued++;
  } else if (isCalibrationDue) {
    typeMap[typeName].calibrationDue++;
  } else {
    typeMap[typeName].active++;
  }
 
  typeMap[typeName].total++;
});
 
setGageTypeStats(Object.values(typeMap));
    } catch (error) {
      console.error("Error fetching gages:", error);
    }
  };
 
  fetchData();
}, []);
 
  // Animate NPS progress on load
  useEffect(() => {
    let progress = 0;
    const target = 71.3;
    const interval = setInterval(() => {
      progress += 1;
      if (progress >= target) {
        progress = target;
        clearInterval(interval);
      }
      setNpsProgress(progress);
    }, 15);
    return () => clearInterval(interval);
  }, []);
 
  const handleOpenPopup = () => setIsPopupOpen(true);
  const handleClosePopup = () => setIsPopupOpen(false);
 
 
  // Fetch Available Gages
// Fetch Available Gages
const fetchAvailableGages = async () => {
  setLoadingAvailable(true);
  try {
    const allGages = await getGages();
    const issued = await listGageIssues();
 
    // Compare by serialNumber or id
    const issuedSerials = new Set(issued.map((i) => i.serialNumber));
const available = allGages.filter((g) => !issuedSerials.has(g.serialNumber));
 
 
    setAvailableGages(available);
    setIssuedGages(issued); // keep issued updated as well
    // setShowAvailableGages(true);
  } catch (error) {
    console.error("Error fetching available gages:", error);
  } finally {
    setLoadingAvailable(false);
  }
};
 
const fetchIssuedGages = async () => {
  setLoadingIssued(true);
  try {
    const issues = await listGageIssues(); // returns issued gages
 
    const issued = issues.map((item) => ({
      id: item.id,
      serialNumber: item.serialNumber || "N/A",
      gageName: item.title || "-",           // <-- map title to gageName
      modelNumber: item.modelNumber || "-", // <-- optional, fallback
      gageTypeName: item.priority || "-",   // <-- optional, fallback
      description: item.description || "",
      location: item.store || "-",          // <-- map store to location
      manufacturerId: item.manufacturerId || "-", // optional
      assignedTo: item.assignedTo || "-",
      dueDate: item.dueDate || "-",
    }));
 
    setIssuedGages(issued);
    // setShowIssuedGages(true);
  } catch (error) {
    console.error("Error fetching issued gages:", error);
  } finally {
    setLoadingIssued(false);
  }
};
 
const VerticalProgressBar = ({ label, value, total, color = "bg-blue-500" }) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
 
  return (
    <div className="flex flex-col items-center w-full max-w-[80px]">
      <div className="relative w-16 h-32 mb-2">
        {/* Background */}
        <div className="absolute bottom-0 w-full bg-gray-200 rounded-t-full" style={{ height: '100%' }}></div>
        {/* Progress */}
        <div
          className={`absolute bottom-0 w-full ${color} rounded-t-full transition-all duration-500 ease-out`}
          style={{ height: `${percent}%` }}
        ></div>
        {/* Value on top */}
        <div className="absolute top-0 left-0 w-full text-center text-xs font-bold text-gray-700 mt-1">
          {value}
        </div>
      </div>
      <span className="text-xs text-gray-600 text-center w-full">{label}</span>
    </div>
  );
};
 
const GageTypeBar = ({ type }) => {
  const max = type.total || 1;
 
  // Order from bottom to top: Active → Issued → Calibration → Retired
  const segments = [
    { key: 'active', color: 'bg-green-500', value: type.active, label: 'Active' },
    { key: 'issued', color: 'bg-orange-500', value: type.issued, label: 'Issued' },
    { key: 'calibrationDue', color: 'bg-blue-500', value: type.calibrationDue, label: 'Cal Due' },
    { key: 'retired', color: 'bg-red-500', value: type.retired, label: 'Retired' },
  ];
 
  return (
    <div className="flex flex-col items-center w-full max-w-[90px]">
      <div className="relative w-14 h-44 mb-2 bg-gray-100 rounded-lg overflow-hidden">
        {segments
          .filter(seg => seg.value > 0)
          .map((seg, idx, arr) => {
            const heightPercent = (seg.value / max) * 100;
            const bottomOffset = arr
              .slice(0, idx)
              .reduce((sum, s) => sum + (s.value / max) * 100, 0);
 
            return (
              <div
                key={seg.key}
                className={`absolute w-full ${seg.color} transition-all duration-500`}
                style={{
                  height: `${heightPercent}%`,
                  bottom: `${bottomOffset}%`,
                }}
                title={`${seg.label}: ${seg.value}`}
              />
            );
          })}
      </div>
      <span className="text-xs text-gray-700 text-center font-medium mt-1 line-clamp-1">
        {type.name}
      </span>
      <span className="text-xs text-gray-500 mt-0.5">Total: {type.total}</span>
    </div>
  );
};
 
// Step 1: Function to refresh gage lists
const refreshGageLists = async () => {
  await fetchAvailableGages(); // refresh available gages
  await fetchIssuedGages();    // refresh issued gages
};
 
 
// At top, update filteredIssues logic
const filteredCases = casesData.filter((it) => {
  const query = searchIssued.toLowerCase(); // or a new search state for cases
  return (
    (it.title || '').toLowerCase().includes(query) ||
    (it.description || '').toLowerCase().includes(query) ||
    (it.priority || '').toLowerCase().includes(query)
  );
});
 
 
// Similarly for available gages search, create filteredAvailableGages
const [availableSearch, setAvailableSearch] = useState("");
const filteredAvailableGages = availableGages.filter(it => {
  const query = availableSearch.toLowerCase();
  return (
    (it.serialNumber || '').toLowerCase().includes(query) ||
    (it.gageName || '').toLowerCase().includes(query) ||
    (it.department || '').toLowerCase().includes(query) ||
    (it.func || '').toLowerCase().includes(query) ||
    (it.operation || '').toLowerCase().includes(query) ||
    (it.location || '').toLowerCase().includes(query)
  );
});
 
 
 
const AvailableGagesDrawer = ({ isOpen, onClose, list, search, setSearch, loading }) => {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
 
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(handler);
  }, [search]);
 
  const filteredList = list.filter((g) =>
    (
      g.gageName +
      g.serialNumber +
      g.modelNumber +
      g.gageType?.name +
      g.location +
      g.manufacturer
    )
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );
 
  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-green-600 text-white">
          <h3 className="text-xl font-bold">Available Gages ({list.length})</h3>
          <button className="text-white/80 hover:text-white text-2xl font-bold" onClick={onClose}>
            ✕
          </button>
        </div>
 
        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search gage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
 
        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-[180px] justify-items-center">
          {loading ? (
            <div className="text-gray-400 text-center py-10 italic w-full col-span-2">Loading...</div>
          ) : filteredList.length > 0 ? (
            filteredList.map((g) => (
              <div
                key={g.id || g.serialNumber}
                className="border rounded-xl p-4 shadow-sm bg-white w-full max-w-[95%] h-full flex flex-col justify-between"
              >
                <h4 className="text-blue-700 font-semibold text-sm truncate">{g.gageName}</h4>
                <p className="text-xs text-gray-500 mt-1">Serial: <span className="font-medium">{g.serialNumber}</span></p>
                <p className="text-xs text-gray-500 mt-1">Model: <span className="font-medium">{g.modelNumber}</span></p>
                <p className="text-xs text-gray-500 mt-1">Type: {g.gageType?.name || "-"}</p>
                <p className="text-xs text-gray-500 mt-1">Location: {g.location || "-"}</p>
               
                <span className="mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">Active</span>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-10 italic w-full col-span-2">No items found</div>
          )}
        </div>
      </div>
    </div>
  );
};
 
const IssuedGagesDrawer = ({ isOpen, onClose, list, search, setSearch, loading }) => {
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [expandedId, setExpandedId] = useState(null);
 
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(handler);
  }, [search]);
 
  const filteredList = list.filter((g) =>
    (g.gageName + g.serialNumber + g.modelNumber + (g.description || "") + (g.assignedTo || ""))
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );
 
  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b rounded-lg bg-orange-400 text-white">
  <h3 className="text-xl font-bold">Issued Gages ({list.length})</h3>
  <button
    className="text-white/80 hover:text-white text-2xl font-bold"
    onClick={onClose}
  >
    ✕
  </button>
</div>
 
        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search gage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
 
        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-[180px] justify-items-center">
          {loading ? (
            <div className="text-gray-400 text-center py-10 italic w-full col-span-2">Loading...</div>
          ) : filteredList.length > 0 ? (
            filteredList.map((g) => {
              const isExpanded = expandedId === g.id;
 
              return (
                <div
                  key={g.id || g.serialNumber}
                  className="border rounded-xl p-4 shadow-sm bg-white w-full max-w-[95%] flex flex-col"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-blue-700 font-semibold text-sm truncate">{g.gageName}</h4>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : g.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? "Collapse ▲" : "Expand ▼"}
                    </button>
                  </div>
 
                  <p className="text-xs text-gray-500 mt-1">Serial: <span className="font-medium">{g.serialNumber}</span></p>
                  {/* <p className="text-xs text-gray-500 mt-1">Model: <span className="font-medium">{g.modelNumber}</span></p> */}
 
                  {isExpanded && (
                    <div className="mt-2 text-xs text-gray-600 max-h-40 overflow-y-auto">
                      <p>Description: {g.description || "-"}</p>
                      <p>Assigned To: {g.assignedTo || "-"}</p>
                    </div>
                  )}
 
                  <span className="mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">Issued</span>
                </div>
              );
            })
          ) : (
            <div className="text-gray-400 text-center py-10 italic w-full col-span-2">No items found</div>
          )}
        </div>
      </div>
    </div>
  );
};
 
 
 
 
 
  return (
    // 🔸 Root div: NO p-6 here anymore
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* 🔸 New wrapper: p-6 moved here */}
      <div className="p-6 space-y-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-800 ml-6">My Store </h1>
 
       {/* Top Cards including NPS */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
  {/* Other Cards */}
  {[
    { title: "Inventory Overview", desc: "Track available stock levels.", icon: <Package />, gradient: "from-purple-500 to-indigo-500" },
    { title: "Pending Orders", desc: "View and approve pending requests.", icon: <FileText />, gradient: "from-pink-500 to-rose-500" },
    { title: "Staff Performance", desc: "Monitor team productivity.", icon: <BarChart2 />, gradient: "from-green-400 to-teal-400" },
  ].map((card, idx) => (
    <div
      key={idx}
      className="flex flex-col justify-between bg-white/80 backdrop-blur-md text-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-48"
    >
      {/* Icon Badge */}
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r ${card.gradient} text-white mb-4`}>
        {React.cloneElement(card.icon, { className: "w-6 h-6" })}
      </div>
 
      {/* Card Content */}
      <div className="mt-auto">
        <h3 className="text-xl font-semibold">{card.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{card.desc}</p>
      </div>
    </div>
  ))}
 
  {/* NPS Card */}
  <div className="flex flex-col justify-between bg-white/80 backdrop-blur-md text-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 h-48">
    <p className="text-gray-500 font-medium text-sm mb-1">Your NPS</p>
    <div className="relative w-full flex justify-center mt-1">
      <div className="w-[150px] h-[120px]">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle
            cx="18"
            cy="18"
            r="16"
            strokeWidth="3"
            fill="none"
            className="text-gray-200"
            stroke="currentColor"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            stroke="url(#grad)"
            strokeDasharray="100"
            strokeDashoffset={100 - npsProgress}
            transform="rotate(-90 18 18)"
            className="transition-all duration-300 ease-out"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#993bf6ff" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{npsProgress.toFixed(1)}</span>
          <span className="text-xs text-gray-400 mt-1">Last: 69.3</span>
          <span className="text-green-500 font-semibold mt-0.5 text-sm">+2.0</span>
        </div>
      </div>
    </div>
  </div>
</div>
 
 
 
        {/* Main Panels */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel */}
          <div className="flex-1 flex flex-col gap-6">
 
            {/* Gage Usage by Type - Labels Inside Respective Color Segments */}
<div className="bg-white p-4 rounded-2xl shadow-md">
  <div className="flex justify-between items-center mb-4">
    <p className="text-gray-500 font-semibold">Gage Usage by Type</p>
    <button
      onClick={() => setShowAllTypes(!showAllTypes)}
      className="text-xs px-3 py-1 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 transition"
    >
      {showAllTypes ? "Hide Empty" : "Show All"}
    </button>
  </div>
 
  {gageTypeStats.length === 0 ? (
    <p className="text-gray-500 text-center py-4 text-sm">Loading gage types...</p>
  ) : (
    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
      {gageTypeStats
        .filter(type => showAllTypes || type.total > 0)
        .map((type) => {
          const total = type.total || 0;
          const active = Number(type.active) || 0;
          const issued = Number(type.issued) || 0;
          const calDue = Number(type.calibrationDue) || 0;
          const retired = Number(type.retired) || 0;
 
          // Skip rendering bar if total is 0 (optional)
          if (total === 0) {
            return (
              <div key={type.name} className="border rounded-xl p-4 bg-white shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-2">{type.name} (0)</h4>
                <div className="w-full h-10 bg-gray-200 rounded-lg flex items-center px-3">
                  <span className="text-sm text-gray-500">No gages</span>
                </div>
              </div>
            );
          }
 
          return (
            <div
  key={type.name}
  className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
>
  <h4 className="font-semibold text-gray-800 mb-2">{type.name} ({total})</h4>

  {/* Flex container for segments */}
  <div className="w-full h-10 bg-gray-200 rounded-lg overflow-hidden flex">
    {/* Active Segment */}
    {active > 0 && (
      <div
        className="bg-green-200 flex items-center justify-center relative"
        style={{ width: `${Math.round((active / total) * 100)}%` }}
        title={`Active: ${active} gage(s)`}
      >
        <span className="text-green-800 text-sm font-medium px-1 truncate">
          Active ({active})
        </span>
      </div>
    )}

    {/* Issued Segment */}
    {issued > 0 && (
      <div
        className="bg-orange-200 flex items-center justify-center relative"
        style={{ width: `${Math.round((issued / total) * 100)}%` }}
        title={`Issued: ${issued} gage(s)`}
      >
        <span className="text-orange-800 text-sm font-medium px-1 truncate">
          Issued ({issued})
        </span>
      </div>
    )}

    {/* Out of Calibration Segment */}
    {calDue > 0 && (
      <div
        className="bg-blue-200 flex items-center justify-center relative"
        style={{ width: `${Math.round((calDue / total) * 100)}%` }}
        title={`Out of Calibration: ${calDue} gage(s)`}
      >
        <span className="text-blue-800 text-sm font-medium px-1 truncate">
          Out of Cal ({calDue})
        </span>
      </div>
    )}

    {/* Retired Segment */}
    {retired > 0 && (
      <div
        className="bg-red-200 flex items-center justify-center relative"
        style={{ width: `${Math.round((retired / total) * 100)}%` }}
        title={`Retired: ${retired} gage(s)`}
      >
        <span className="text-red-800 text-sm font-medium px-1 truncate">
          Retired ({retired})
        </span>
      </div>
    )}
  </div>
</div>
          );
        })}
    </div>
  )}
</div>
            {/* Focus & Thriving */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Welcoming", icon: "↘", color: "from-red-400 to-red-300", desc: "Score dropped 15.2% this month." },
                { title: "Service", icon: "😞", color: "from-red-500 to-red-400", desc: "8 negative comments with keyword 'service'." },
                { title: "Checkout", icon: "😊", color: "from-green-300 to-green-300", desc: "6 positive comments with keyword 'checkout'." },
              ].map((focus, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-r ${focus.color} text-white p-6 rounded-2xl shadow-lg transform hover:scale-105 transition`}
                >
                  <h3 className="font-semibold text-lg mb-2 flex justify-between">
                    {focus.title} <span>{focus.icon}</span>
                  </h3>
                  <p className="text-sm">{focus.desc}</p>
                </div>
              ))}
            </div>
          </div>
 
          {/* Right Panel: Cases */}
          <div className="flex-1 bg-white p-4 rounded-2xl shadow-md flex flex-col">
            {/* Drawer Buttons */}
            <div className="flex gap-4 mb-4">
              <div className="flex gap-4 mb-4">
    <button
    onClick={async () => {
      setShowAvailableGages(true); // open drawer
      await fetchAvailableGages();  // refresh data
    }}
    className="flex items-center gap-2 px-4 py-2 rounded-lg shadow text-sm font-semibold bg-green-50 hover:bg-green-100 text-green-700"
>
    🟢 Available Gages ({availableGages.length})
</button>
 
<button
  onClick={async () => {
    setShowIssuedGages(true); // open drawer
    await fetchIssuedGages();  // refresh data
  }}
  className="flex items-center gap-2 px-4 py-2 rounded-lg shadow text-sm font-semibold bg-orange-100 hover:bg-orange-200 text-orange-700"
>
  🟠 Issued Gages ({issuedGages.length})
</button>
 
</div>
 
 
            </div>
 
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Cases</h2>
              <button
                onClick={handleOpenPopup}
                className="group flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl shadow hover:bg-green-600 transition"
              >
                <ClipboardCheck className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180 animate-pulse" />
                Issue Gage
              </button>
            </div>
 
            <div className="flex border-b border-gray-200 mb-4">
              <button className="px-4 py-1 border-b-2 border-blue-500 font-semibold">All Open 5</button>
              <button className="px-4 py-1 flex items-center gap-2 text-gray-700 hover:text-gray-900">
                Past Due 1
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">1</span>
              </button>
            </div>
 
            {/* Cases List */}
            <div className="flex-1 overflow-y-auto space-y-4">
                          {casesData.map((c, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg hover:shadow-lg transition bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedCase(expandedCase === idx ? null : idx)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">{c.title}</h3>
                    <span className="text-gray-400 text-sm">{c.due}</span>
                  </div>
 
                  <p className="text-gray-600 text-sm mt-1">
                    {expandedCase === idx
                      ? c.description
                      : c.description.length > 80
                      ? c.description.substring(0, 80) + "..."
                      : c.description}
                  </p>
 
                  {expandedCase === idx && (
                    <>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mt-2 ${
                          c.priority === "High Priority"
                            ? "bg-red-100 text-red-600 animate-pulse"
                            : c.priority === "Critical Priority"
                            ? "bg-red-200 text-red-700 animate-pulse"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.priority}
                      </span>
 
                      {c.images && (
                        <div className="flex gap-2 mt-2">
                          {c.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="case"
                              className="w-16 h-16 object-cover rounded-lg shadow-sm transform hover:scale-105 transition"
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
 
                  <p className="text-xs text-blue-500 mt-2">
                    {expandedCase === idx ? "Click to collapse ▲" : "Click to expand ▼"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> {/* 🔸 Close the new .p-6 wrapper */}
 
      {/* Drawers */}
<AvailableGagesDrawer
  isOpen={showAvailableGages}
  onClose={() => setShowAvailableGages(false)}
  list={availableGages}
  search={searchAvailable}
  setSearch={setSearchAvailable}
  loading={loadingAvailable}
/>
 
<IssuedGagesDrawer
  isOpen={showIssuedGages}
  onClose={() => setShowIssuedGages(false)}
  list={issuedGages}
  search={searchIssued}
  setSearch={setSearchIssued}
  loading={loadingIssued}
/>
 
 
      {/* Issue Gage Popup */}
      <IssueGageForm
  isOpen={isPopupOpen}
  onClose={handleClosePopup}
  onIssued={refreshGageLists} // <-- new prop
/>
 
    </div>
  );
}
 