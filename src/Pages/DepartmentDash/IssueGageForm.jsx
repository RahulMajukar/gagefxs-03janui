// IssueGageForm.jsx
import React, { useEffect, useState } from "react";
import { FaExclamationCircle } from "react-icons/fa";
import {
  getDepartments, getFunctions, getOperations, getGages, getGageBySerial,
  listGageIssues, countGageIssues, createGageIssue
} from "../../api/api";
 
export default function IssueGageForm({ isOpen, onClose, onIssued }) {
 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [serialNumber, setSerialNumber] = useState("");
  const [dept, setDept] = useState("");
  const [func, setFunc] = useState("");
  const [operation, setOperation] = useState("");
  const [departments, setDepartments] = useState([]);
  const [functionsList, setFunctionsList] = useState([]);
  const [operations, setOperations] = useState([]);
  const [serialOptions, setSerialOptions] = useState([]);
  const [hoverGage, setHoverGage] = useState(null);
  const [issueCount, setIssueCount] = useState(0);
  const [issueListOpen, setIssueListOpen] = useState(false);
  const [issues, setIssues] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
 
 
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [gageType, setGageType] = useState("");  // New: selected gage type
const [filteredSerials, setFilteredSerials] = useState([]); // serials based on gage type
const [gageStats, setGageStats] = useState([]);
const [allGages, setAllGages] = useState([]); // NEW
 const [isSubmitting, setIsSubmitting] = useState(false);
 
 
// Filtered issues based on search
const filteredIssues = issues.filter((it) =>
  it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  (it.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
  (it.assignedTo || '').toLowerCase().includes(searchQuery.toLowerCase())
);
 
 
const refreshSerialOptions = async (issuesList = issues) => {
  try {
    const gages = await getGages();
    setAllGages(gages || []);

    // Get the current date for comparison
    const today = new Date();
    // Set time to the end of the day (23:59:59) to ensure we compare correctly against dates
    today.setHours(23, 59, 59, 999);

    // Filter gages:
    // 1. Must have status 'ACTIVE' (or your required base status)
    // 2. Must have a valid nextCalibrationDate (or pendingCalibrationDate if extended) in the future
    const activeAndCalibratedGages = (gages || []).filter(g => {
      // Check base status
      if (g.status !== 'ACTIVE') {
        return false;
      }

      // Determine the effective calibration deadline
      let effectiveCalDate = g.nextCalibrationDate; // Use the standard next calibration date first
      // If an extended date exists and is later than the standard date, use it
      if (g.pendingCalibrationDate) {
        const pendingDateObj = new Date(g.pendingCalibrationDate);
        const standardDateObj = g.nextCalibrationDate ? new Date(g.nextCalibrationDate) : null;
        // Only use pending if it's a valid date and later than the standard date
        if (standardDateObj && !isNaN(standardDateObj.getTime()) && pendingDateObj > standardDateObj) {
          effectiveCalDate = g.pendingCalibrationDate;
        } else if (!standardDateObj || isNaN(standardDateObj.getTime())) {
          // If standard date is invalid, use pending if it's valid
          effectiveCalDate = g.pendingCalibrationDate;
        }
      }

      // Check if effective calibration date is valid and in the future
      if (!effectiveCalDate) {
        console.warn(`Gage ${g.serialNumber} has no calibration date, excluding from issuance.`);
        return false; // Exclude if no calibration date exists
      }

      const effectiveDateObj = new Date(effectiveCalDate);
      if (isNaN(effectiveDateObj.getTime())) {
         console.warn(`Gage ${g.serialNumber} has an invalid calibration date (${effectiveCalDate}), excluding from issuance.`);
        return false; // Exclude if the date string is invalid
      }

      // The gage is valid for issuance only if the effective date is *after* today
      return effectiveDateObj > today;
    });

    // Get serial numbers that are already issued
    const issuedSerials = (issuesList || []).map(i => i.serialNumber);

    setSerialOptions(
      // Further filter the active and calibrated gages to exclude those already issued
      activeAndCalibratedGages
        .filter(g => !issuedSerials.includes(g.serialNumber)) // ✅ This line ensures issued gages are not in the dropdown
        .map(g => ({
          id: g.id,
          serialNumber: g.serialNumber,
          name: g.gageName,
          department: g.department,
          func: g.function,
          operation: g.operation,
          location: g.location,
          gageType: g.gageType?.name || g.gageName || "",
        }))
    );
  } catch (err) {
    console.error("Failed to refresh serial options:", err);
    // Optionally, reset serialOptions to an empty array on error
    setSerialOptions([]);
  }
};
 
 
  useEffect(() => {
  let mounted = true;
 
  const fetchInitialData = async () => {
    try {
      const [deps, funcs, ops, gages, cnt] = await Promise.all([
        getDepartments().catch(() => []),
        getFunctions().catch(() => []),
        getOperations().catch(() => []),
        getGages().catch(() => []),
        countGageIssues().catch(() => 0),
      ]);
 
      if (!mounted) return;
 
      setDepartments(deps || []);
      setFunctionsList(funcs || []);
      setOperations(ops || []);
      setIssues(await listGageIssues()); // load current issues
      setIssueCount(cnt || 0);
 
      await refreshSerialOptions(); // dynamically populate dropdown
    } catch (err) {
      console.error(err);
    }
  };
 
  fetchInitialData();
 
  return () => { mounted = false; };
}, []);
 
// Automatically filter serial numbers based on selected gage type
useEffect(() => {
  if (!gageType) {
    setFilteredSerials(serialOptions);
    return;
  }
 
  const filtered = serialOptions.filter((g) => g.gageType === gageType);
  setFilteredSerials(filtered);
 
  // Reset serial number & location if type changes
  setSerialNumber("");
  setSelectedLocation("");
}, [gageType, serialOptions]);
 
const handleSubmit = async (e) => {
  e.preventDefault();
 
  if (isSubmitting) return;
 
  // Validation
  if (!gageType?.trim()) {
    alert("Please select a Gage Type.");
    return;
  }
  if (!serialNumber?.trim()) {
    alert("Please select a Serial Number.");
    return;
  }
  if (!description?.trim()) {
    alert("Please enter a Description.");
    return;
  }
  if (issues.some(i => i.serialNumber === serialNumber)) {
    alert("This gage has already been issued!");
    return;
  }
 
  setIsSubmitting(true);
 
  const payload = {
    title: title?.trim() || "No Title",
    description: description.trim(),
    priority: "MEDIUM",
    status: "OPEN",
    serialNumber: serialNumber,
    dept: dept || null,
    func: func || null,
    operation: operation || null,
    assignedTo: assignedTo || null,
    attachments: attachments.map(f => f.name) || [],
    tags: []
  };
 
  try {
    // 🧪 SIMULATE SLOW NETWORK (5 seconds delay) — FOR TESTING ONLY
    //await new Promise(resolve => setTimeout(resolve, 5000));
 
    // Now make the real API call
    const saved = await createGageIssue(payload);
    if (onIssued) onIssued(saved);
 
    const updatedIssues = await listGageIssues();
    setIssueCount(updatedIssues.length);
    await refreshSerialOptions(updatedIssues);
 
    setShowSuccessPopup(true);
 
    setTimeout(() => {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setAttachments([]);
      setSerialNumber("");
      setDept("");
      setFunc("");
      setOperation("");
      setSelectedLocation("");
      setGageType("");
      setShowSuccessPopup(false);
      onClose();
    }, 2000);
  } catch (err) {
    console.error("Submission error:", err);
    alert("Failed to submit the issue. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
 
useEffect(() => {
  const stats = Array.from(new Set(allGages.map(g => g.gageType?.name || g.gageName)))
    .filter(Boolean)
    .map(type => {
      const total = allGages.filter(g => (g.gageType?.name || g.gageName) === type).length;
      const issued = issues.filter(i => {
        const gage = allGages.find(s => s.serialNumber === i.serialNumber);
        return (gage?.gageType?.name || gage?.gageName) === type;
      }).length;
 
      return { type, total, issued };
    });
 
  setGageStats(stats);
}, [allGages, issues]);
 
 
  const handleFileChange = (e) => setAttachments(Array.from(e.target.files));
  if (!isOpen) return null;
 
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-indigo-900/60 backdrop-blur-sm z-50 px-4 py-4 overflow-auto">
      <div className="bg-gradient-to-br from-white to-gray-50/95 rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] relative overflow-y-auto">
       
        {/* Top Header */}
        <div className="flex justify-between items-start bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-4 rounded-t-2xl shadow-lg border-b border-blue-500/30">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <FaExclamationCircle className="text-yellow-300 text-lg drop-shadow-lg" />
              </div>
              Issue Gage 
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-blue-100 text-xs md:text-sm font-medium">Fill out the required fields to submit an issue</p>
              <button
                type="button"
                onClick={async () => { setIssueListOpen(true); try { setIssues(await listGageIssues()); } catch {} }}
                className="ml-2 text-xs bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full border border-white/20"
                title="View all issues"
              >
                View Issues ({issueCount})
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 text-xl font-bold ml-4 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
          >
            ✕
          </button>
        </div>
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-white to-gray-50">
{/* Gage Usage Overview */}
{/* <div className="md:col-span-2 mt-6 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
  <div className="flex justify-between items-center mb-3">
    <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wide">Gage Usage Overview</h3>
    {hoverGage && (
      <button
        onClick={() => setHoverGage(null)}
        className="text-xs text-blue-600 font-semibold hover:underline"
      >
        Show All
      </button>
    )}
  </div> */}
 
  {/* Horizontal stacked bar with smooth animation */}
  {/* <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden flex items-center">
    {gageStats.map((g, index) => {
      const widthPercent = g.total ? (g.total / allGages.length) * 100 : 0;
      const baseColor = `hsl(${(index * 37) % 360}, 65%, 55%)`;
      const gradient = `linear-gradient(to top, ${baseColor}, hsl(${(index * 37) % 360}, 65%, 75%))`;
 
      return (
        <div
          key={g.type}
          className="h-full relative flex justify-center items-center group cursor-pointer transition-all duration-1000 ease-out"
          style={{ width: `${widthPercent}%`, background: gradient }}
          onClick={() => setHoverGage(g.type)}
        > */}
          {/* Tooltip */}
          {/* <div
            className="absolute bottom-full mb-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs z-50 break-words pointer-events-none"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="font-semibold truncate">{g.type}</div>
            <div className="text-gray-600">Issued: <span className="font-medium">{g.issued}</span></div>
            <div className="text-gray-600">Total: <span className="font-medium">{g.total}</span></div>
            <div className="text-blue-600 font-semibold">Usage: {((g.issued / g.total) * 100).toFixed(1)}%</div>
          </div>
        </div>
      );
    })}
  </div> */}
 
  {/* Scrollable mini cards with progress rings */}
  {/* <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 p-1">
    {(hoverGage
      ? gageStats.filter(g => g.type === hoverGage)
      : gageStats
    ).map((g, index) => {
      const color = `hsl(${(index * 37) % 360}, 65%, 55%)`;
      const usagePercent = ((g.issued / g.total) * 100).toFixed(1);
 
      return (
        <div
          key={g.type}
          className="flex-shrink-0 flex flex-col items-center justify-center min-w-[100px] bg-white rounded-2xl shadow-md p-3 border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-300"
        > */}
          {/* Progress ring */}
          {/* <div className="relative w-12 h-12 mb-2">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
              />
              <circle
                className="text-blue-600 transition-all duration-1000"
                strokeWidth="4"
                stroke="currentColor"
                strokeDasharray={125.6} // 2πr
                strokeDashoffset={125.6 - (125.6 * usagePercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                r="20"
                cx="24"
                cy="24"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">{usagePercent}%</div>
          </div>
 
          <div className="text-gray-800 text-xs font-semibold truncate text-center">{g.type}</div>
          <div className="text-blue-600 text-sm font-medium mt-1">{g.issued}/{g.total}</div>
        </div>
      );
    })}
  </div>
</div> */}
 
 
 
 
          {/* Gage Type */}
<div className="group">
  <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Gage Type</label>
  <select
    value={gageType}
    onChange={(e) => setGageType(e.target.value)}
    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer text-sm"
    required
  >
    <option value="">Select Gage Type</option>
    {Array.from(new Set(serialOptions.map((s) => s.gageType)))
      .filter(Boolean)
      .map((type) => (
        <option key={type} value={type}>{type}</option>
      ))}
  </select>
</div>
 
 {/* Serial Number */}
          <div className="group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Serial Number</label>
            <select
              value={serialNumber || ""}
              onChange={async (e) => {
                const val = e.currentTarget.value;
                setSerialNumber(val);
                if (!val) { setHoverGage(null); setTitle(""); setSelectedLocation(""); return; }
                try {
                  const gage = await getGageBySerial(val);
                  setHoverGage(gage);
                  setTitle(gage.gageType?.name || gage.gageName || '');
                  setDept(gage.department || '');
                  setFunc(gage.function || '');
                  setOperation(gage.operation || '');
                  setSelectedLocation(gage.location || '');
                } catch { setHoverGage(null); setTitle(""); setSelectedLocation(""); }
              }}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-sm appearance-none cursor-pointer text-sm"
              required
            >
              <option value="">Select Serial Number</option>
              {filteredSerials.map(opt => (
  <option key={opt.id} value={opt.serialNumber}>{opt.serialNumber}</option>
))}
 
            </select>
          </div>
 
 
          {/* Location Info (readonly) */}
<div className="md:col-span-2 flex flex-col">
  <label className="text-sm font-medium text-gray-700 mb-1">Current Location</label>
  <input
    type="text"
    value={selectedLocation || '-'}
    readOnly
    className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
  />
</div>
 
{/* Department / Function / Operation */}
          <div className="group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Department</option>
              {departments.map(d => (<option key={d.id} value={d.name}>{d.name}</option>))}
            </select>
          </div>
 
          <div className="group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Function</label>
            <select value={func} onChange={(e) => setFunc(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Function</option>
              {functionsList.map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}
            </select>
          </div>
 
          <div className="group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Operation</label>
            <select value={operation} onChange={(e) => setOperation(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="">Select Operation</option>
              {operations.map(o => (<option key={o.id} value={o.name}>{o.name}</option>))}
            </select>
          </div>
 
          {/* Assigned To */}
          <div className="group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Assigned To</label>
            <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Assign to team member" className="w-full border rounded px-3 py-2"/>
          </div>
 
          {/* Description */}
          <div className="md:col-span-2 group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Description *</label>
            <textarea
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail"
              rows={4}
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm text-sm"
              required
            />
          </div>
 
          {/* Attachments */}
          <div className="md:col-span-2 group">
            <label className="block text-gray-800 font-semibold mb-2 text-xs uppercase tracking-wide">Attachments</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 bg-white/60 hover:bg-white/80 backdrop-blur-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm"
            />
          </div>
 
   
 
          {/* Submit */}
          <div className="md:col-span-2 flex justify-end mt-4">
            <button
  type="submit"
  disabled={isSubmitting}
  className={`font-bold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 ${
    isSubmitting
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:shadow-xl'
  }`}
>
  {isSubmitting ? 'It is submitting... Please wait.' : 'Submit Issue'}
</button>
          </div>
 
        </form>
 
 
        {/* Issues Drawer */}
{issueListOpen && (
  <div
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
    onClick={() => setIssueListOpen(false)}
  >
    <div
      className={`ml-auto relative w-full max-w-xl max-h-[90vh] mb-4 bg-gradient-to-br from-white to-gray-50/95 shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out ${
        issueListOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 rounded-t-2xl shadow-lg border-b border-blue-500/30 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex-shrink-0">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FaExclamationCircle className="text-yellow-300 text-lg drop-shadow-lg" />
          All Issued Gages ({issues.length})
        </h3>
        <button
          className="text-white/80 hover:text-white text-2xl font-bold transition-all duration-200"
          onClick={() => setIssueListOpen(false)}
        >
          ✕
        </button>
      </div>
 
      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search by title, serial number, or assigned to..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm"
        />
      </div>
 
      {/* Scrollable body */}
<div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
  {filteredIssues.length > 0 ? (
    filteredIssues.map((it) => (
      <div
        key={it.id}
        className="border rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm"
      >
        <div className="font-semibold text-blue-700 text-lg">{it.title}</div>
        <div className="text-xs text-gray-600 mt-1">
          Serial: <span className="font-medium">{it.serialNumber}</span> | Assigned To:{" "}
          <span className="font-medium">{it.assignedTo || '-'}</span>
        </div>
        <div className="text-sm text-gray-500 mt-2">{it.description || 'No description'}</div>
      </div>
    ))
  ) : (
    <div className="text-gray-400 text-center py-10 italic col-span-2">No issues found</div>
  )}
</div>
 
    </div>
  </div>
)}
 
 
      </div>
 
 
      {showSuccessPopup && (
  <div className="fixed inset-0 flex items-center justify-center z-51 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
    <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
     
      {/* Success Icon */}
      <div className="bg-green-100 rounded-full p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
     
      {/* Success Text */}
      <p className="text-gray-800 text-center font-semibold text-lg">Issue submitted successfully!</p>
      <p className="text-gray-500 text-sm text-center">You can view it in the issue list.</p>
     
    </div>
  </div>
)}
 
 
    </div>
  );
}