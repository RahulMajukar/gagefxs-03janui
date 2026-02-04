// SupportTicketModal.jsx
import React, { useState, useEffect, useRef } from "react";
import Modal from "../Modal";
import { AlertTriangle, Plus, Loader2, Camera, Video, X, ChevronDown, ChevronRight, Search, Check, Paperclip, Info } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { getOperatorFilteredGageIssuesByPriority, getGages, getGagesByType } from "../../api/api";
import Webcam from "react-webcam";

const Tooltip = ({ content, children }) => (
  <div className="relative inline-block group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-[200px] z-10">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
    </div>
  </div>
);

const SupportTicketModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [ticketEmail, setTicketEmail] = useState({
    to: "",
    cc: [],
    ccInput: "",
    subject: "",
    body: "",
  });
  // State for assigned gages
  const [assignedGages, setAssignedGages] = useState([]);
  const [loadingAssignedGages, setLoadingAssignedGages] = useState(false);
  const [errorLoadingGages, setErrorLoadingGages] = useState("");
  // State for gages to include in the ticket
  const [ticketGages, setTicketGages] = useState([]);
  // NEW: State for tracking selected assigned gages
  const [selectedAssignedGageSerials, setSelectedAssignedGageSerials] = useState(new Set());
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [webcamImage, setWebcamImage] = useState(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const webcamRef = useRef(null);
  // NEW STATE: For sending status and success popup
  const [isSending, setIsSending] = useState(false);
  const [showSendSuccess, setShowSendSuccess] = useState(false);
  // NEW STATE: For grouping assigned gages by type
  const [groupedAssignedGages, setGroupedAssignedGages] = useState({});
  // NEW STATE: For collapsible section
  const [isAssignedGagesOpen, setIsAssignedGagesOpen] = useState(true);
  const [isManualGagesOpen, setIsManualGagesOpen] = useState(true);
  // NEW STATE: For search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredGroupedGages, setFilteredGroupedGages] = useState({});
  // NEW STATE: For recording timer
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // --- Helper Functions ---
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedVideoBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 29) {
            if (timerRef.current) clearInterval(timerRef.current);
            recorder.stop();
            setIsRecording(false);
            return 29;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing camera/mic:", err);
      alert("⚠️ Camera or microphone access denied. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // --- Fetch Assigned Gages ---
  useEffect(() => {
    if (isOpen) {
      loadAssignedGages();
    } else {
      // Reset state when modal closes
      setAssignedGages([]);
      setGroupedAssignedGages({});
      setFilteredGroupedGages({}); // Reset filtered list
      setErrorLoadingGages("");
      setWebcamImage(null);
      setRecordedVideoBlob(null);
      setIsRecording(false);
      setIsSending(false);
      setShowSendSuccess(false);
      setIsAssignedGagesOpen(true);
      setIsManualGagesOpen(true);
      setSelectedAssignedGageSerials(new Set());
      setTicketGages([]);
      setSearchTerm("");
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const loadAssignedGages = async () => {
    if (!user || !user.departments || !user.functions || !user.operations) {
      setErrorLoadingGages("User information incomplete.");
      return;
    }
    setLoadingAssignedGages(true);
    setErrorLoadingGages("");
    try {
      const assignedGageIssues = await getOperatorFilteredGageIssuesByPriority(
        user.departments,
        user.functions,
        user.operations
      );
      const activeAssignedIssues = assignedGageIssues.filter(
        g => ["OPEN", "ISSUED", "ACTIVE"].includes(g.status)
      );
      const uniqueGageTypes = [...new Set(activeAssignedIssues.map(g => g.title))];
      const serialToTypeMap = new Map();
      activeAssignedIssues.forEach(g => {
        if (g.title && g.serialNumber) {
          serialToTypeMap.set(g.serialNumber, g.title);
        }
      });

      const allGageDetailsByType = {};
      for (const type of uniqueGageTypes) {
        if (type) {
          const gagesOfType = await getGagesByType(type);
          allGageDetailsByType[type] = gagesOfType;
        }
      }

      const fullAssignedGages = activeAssignedIssues.map(issue => {
        const gageType = issue.title;
        const serialNumber = issue.serialNumber;
        const gageDetails = allGageDetailsByType[gageType]?.find(g => g.serialNumber === serialNumber);
        return {
          gageType: gageType || "N/A",
          serialNumber: serialNumber || "N/A",
          modelNumber: gageDetails?.modelNumber || "N/A",
          department: issue.department || user.departments[0] || "N/A",
          priority: (issue.priority || issue.criticality || "MEDIUM").toUpperCase(),
          isManual: false,
        };
      });

      setAssignedGages(fullAssignedGages);
      console.log("Fetched assigned gages:", fullAssignedGages);

      // Group assigned gages by type
      const grouped = {};
      fullAssignedGages.forEach(gage => {
        if (!grouped[gage.gageType]) {
          grouped[gage.gageType] = [];
        }
        grouped[gage.gageType].push(gage);
      });
      setGroupedAssignedGages(grouped);
      setFilteredGroupedGages(grouped); // Initially, filtered list is the same
    } catch (err) {
      console.error("Error fetching assigned gages:", err);
      setErrorLoadingGages("Failed to load assigned gages. Please try again.");
    } finally {
      setLoadingAssignedGages(false);
    }
  };

  // Apply search filter whenever searchTerm or groupedAssignedGages changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGroupedGages(groupedAssignedGages);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = {};
      Object.entries(groupedAssignedGages).forEach(([gageType, gages]) => {
        const filteredGages = gages.filter(gage =>
          gage.serialNumber.toLowerCase().includes(lowerSearch) ||
          gage.modelNumber.toLowerCase().includes(lowerSearch) ||
          gage.department.toLowerCase().includes(lowerSearch)
        );
        if (filteredGages.length > 0) {
          filtered[gageType] = filteredGages;
        }
      });
      setFilteredGroupedGages(filtered);
    }
  }, [searchTerm, groupedAssignedGages]);

  const handleSendTicket = async () => {
    const toEmails = ticketEmail.to
      .split(',')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (toEmails.length === 0) {
      alert("Please enter at least one valid email in 'To'.");
      return;
    }

    setIsSending(true);
    try {
      const validGages = ticketGages.filter(gage =>
        gage.gageType.trim() || gage.serialNumber.trim()
      );

      const tableHtml = validGages.length > 0 ? `
        <h3 style="margin-top: 16px; color: #0f172a;">Gage Details</h3>
        <table style="width:100%; border-collapse: collapse; margin: 12px 0;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 10px; font-weight: 600; color: #334155;">Gage Type</th>
              <th style="text-align: left; padding: 10px; font-weight: 600; color: #334155;">Serial Number</th>
              <th style="text-align: left; padding: 10px; font-weight: 600; color: #334155;">Model Number</th>
              <th style="text-align: left; padding: 10px; font-weight: 600; color: #334155;">Department</th>
              <th style="text-align: left; padding: 10px; font-weight: 600; color: #334155;">Source</th>
            </tr>
          </thead>
          <tbody>
            ${validGages.map(gage => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; color: #1e293b;">${gage.gageType || "—"}</td>
                <td style="padding: 10px; color: #1e293b;">${gage.serialNumber || "—"}</td>
                <td style="padding: 10px; color: #1e293b;">${gage.modelNumber || "—"}</td>
                <td style="padding: 10px; color: #1e293b;">${gage.department || "—"}</td>
                <td style="padding: 10px; color: #1e293b;">${gage.isManual ? "Manual" : "Assigned"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${ticketEmail.subject || "Support Ticket"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
              color: #1e293b;
              line-height: 1.6;
            }
            .email-container {
              max-width: 700px;
              margin: 30px auto;
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .header {
              background: #f1f5f9;
              padding: 24px 32px;
              display: flex;
              align-items: center;
              gap: 24px;
              border-bottom: 1px solid #e2e8f0;
            }
            .logo {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid #cbd5e1;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 600;
              color: #0f172a;
            }
            .content {
              padding: 32px;
              color: #334155;
            }
            .content h2 {
              margin-top: 0;
              color: #0f172a;
              font-size: 18px;
            }
            .content p {
              margin: 16px 0;
              white-space: pre-wrap;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              font-weight: 600;
              color: #334155;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: left;
              color: #64748b;
              font-size: 13px;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="cid:logo" alt="Logo" class="logo">
              <h1>GageFX Support</h1>
            </div>
            <div class="content">
              <h2>${ticketEmail.subject || "Support Ticket"}</h2>
              <p>${(ticketEmail.body || "No message provided.").replace(/\n/g, '<br>')}</p>
              ${tableHtml}
            </div>
            <div class="footer">
              <p>Best regards,<br><strong>GageFX Team</strong></p>
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailData = new FormData();
      toEmails.forEach(email => emailData.append("to", email));
      (ticketEmail.cc || []).filter(Boolean).forEach(email => emailData.append("cc", email));
      emailData.append("html", fullHtml);
      uploadedFiles.forEach(file => emailData.append("attachments", file));

      const response = await fetch("http://localhost:8080/api/mail/send", {
        method: "POST",
        body: emailData,
      });

      if (response.ok) {
        setShowSendSuccess(true);
        setTimeout(() => {
          setShowSendSuccess(false);
          onClose();
        }, 2500);
      } else {
        let errorMsg = "Unknown error";
        const responseBody = await response.text();
        try {
          const errorJson = JSON.parse(responseBody);
          errorMsg = errorJson.message || errorJson.error || "Failed to send email";
        } catch {
          errorMsg = responseBody.trim() || "Failed to send email";
          if (errorMsg.length > 100) {
            errorMsg = "Server error (check backend logs)";
          }
        }
        alert("❌ " + errorMsg);
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("❌ Network error. Check browser console and backend logs.");
    } finally {
      setIsSending(false);
    }
  };

  // Functions to handle gage selection
  const addAssignedGage = (gage) => {
    const isDuplicate = ticketGages.some(g => g.serialNumber === gage.serialNumber && !g.isManual);
    if (isDuplicate) {
      alert("This assigned gage is already added.");
      return;
    }
    setTicketGages(prev => [...prev, { ...gage, isManual: false }]);
    setSelectedAssignedGageSerials(prev => new Set([...prev, gage.serialNumber]));
  };

  const removeGage = (index) => {
    setTicketGages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAssignedGage = (serialNumberToRemove) => {
    setTicketGages(prev => prev.filter(g => !(g.serialNumber === serialNumberToRemove && !g.isManual)));
    setSelectedAssignedGageSerials(prev => {
      const newSet = new Set(prev);
      newSet.delete(serialNumberToRemove);
      return newSet;
    });
  };

  const captureWebcamImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setWebcamImage(imageSrc);
        const webcamFile = dataURLtoFile(imageSrc, `webcam_${Date.now()}.jpg`);
        setUploadedFiles(prev => [...prev, webcamFile]);
      }
    }
  };

  // Calculate selected gages count
  const selectedGagesCount = ticketGages.length;

  // --- JSX ---
  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Support Ticket"
      className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto"
    >
      <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
        {/* Loading Indicator for Assigned Gages */}
        {loadingAssignedGages && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <span className="ml-2 text-gray-600">Loading assigned gages...</span>
          </div>
        )}

        {/* Error Message for Assigned Gages */}
        {errorLoadingGages && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error Loading Gages</p>
                <p className="text-red-700 text-sm">{errorLoadingGages}</p>
              </div>
            </div>
          </div>
        )}

        {/* Only show form content if not loading */}
        {!loadingAssignedGages && (
          <>
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: To, CC, Subject, Message, Gages */}
              <div className="space-y-5">
                {/* To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
                  <input
                    type="text"
                    value={ticketEmail.to}
                    onChange={(e) => setTicketEmail(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., hod@.com"
                  />
                </div>

                {/* CC Field with Add Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={ticketEmail.ccInput || ""}
                      onChange={(e) => setTicketEmail(prev => ({ ...prev, ccInput: e.target.value }))}
                      className="flex-1 p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email and click Add"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const email = ticketEmail.ccInput?.trim();
                        if (!email) return;
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(email)) {
                          alert("Please enter a valid email address (e.g., user@domain.com).");
                          return;
                        }
                        const currentCC = ticketEmail.cc || [];
                        if (currentCC.includes(email)) {
                          alert("Email already added.");
                          return;
                        }
                        setTicketEmail(prev => ({
                          ...prev,
                          cc: [...currentCC, email],
                          ccInput: "",
                        }));
                      }}
                      className="px-3 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  {ticketEmail.cc && ticketEmail.cc.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ticketEmail.cc.map((email, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full border border-blue-200"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => {
                              setTicketEmail(prev => ({
                                ...prev,
                                cc: prev.cc.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="text-blue-600 hover:text-blue-900 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={ticketEmail.subject}
                    onChange={(e) => setTicketEmail(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Damaged Micrometer - SN: M12345"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    value={ticketEmail.body}
                    onChange={(e) => setTicketEmail(prev => ({ ...prev, body: e.target.value }))}
                    rows={4}
                    className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the issue..."
                  />
                </div>

                {/* Add Gage Section - Collapsible */}
                <div className="border-t pt-4 mt-4">
                  {/* Assigned Gages Section - Collapsible */}
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => setIsAssignedGagesOpen(!isAssignedGagesOpen)}
                      className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <h3 className="text-sm font-medium text-gray-700">
                        Assigned Gages ({assignedGages.length})
                      </h3>
                      {isAssignedGagesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {isAssignedGagesOpen && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {/* Search Bar */}
                        <div className="mb-3 relative">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Serial, Model, or Dept..."
                            className="w-full p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                        
                        {/* Grouped Table View with Scrollbar */}
                        {Object.keys(filteredGroupedGages).length > 0 ? (
                          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {Object.entries(filteredGroupedGages).map(([gageType, gages]) => (
                              <div key={gageType} className="border border-gray-300 rounded p-2">
                                <h4 className="text-xs font-semibold text-gray-600 mb-1">Type: {gageType}</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {gages.map((gage, idx) => {
                                        const isSelected = selectedAssignedGageSerials.has(gage.serialNumber);
                                        return (
                                          <tr key={idx} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">{gage.serialNumber}</td>
                                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">{gage.modelNumber}</td>
                                            <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-700">{gage.department}</td>
                                            <td className="px-2 py-1 whitespace-nowrap text-xs">
                                              {isSelected ? (
                                                <Tooltip content="Remove from ticket">
                                                  <button
                                                    type="button"
                                                    onClick={() => removeAssignedGage(gage.serialNumber)}
                                                    className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                                                  >
                                                    <X size={12} />
                                                  </button>
                                                </Tooltip>
                                              ) : (
                                                <Tooltip content="Add to ticket">
                                                  <button
                                                    type="button"
                                                    onClick={() => addAssignedGage(gage)}
                                                    className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                                                  >
                                                    <Plus size={12} />
                                                  </button>
                                                </Tooltip>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No assigned gages found matching your search.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual Gages Section - Collapsible */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsManualGagesOpen(!isManualGagesOpen)}
                      className="flex items-center justify-between w-full p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <h3 className="text-sm font-medium text-gray-700">
                        Manual Gages ({ticketGages.filter(g => g.isManual).length})
                      </h3>
                      {isManualGagesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    {isManualGagesOpen && (
                      <div className="mt-2 space-y-3">
                        {ticketGages.map((gage, idx) => {
                          if (!gage.isManual) return null; // Only render manual gages here
                          return (
                            <div key={idx} className={`p-3 rounded-lg border ${gage.isManual ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-gray-700">Gage #{idx + 1} {gage.isManual ? "(Manual)" : "(Assigned)"}</span>
                                <button
                                  type="button"
                                  onClick={() => removeGage(idx)}
                                  className="text-red-600 hover:text-red-800 text-xs font-bold"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Gage Type *</label>
                                  <input
                                    type="text"
                                    value={gage.gageType}
                                    onChange={(e) => {
                                      const newGages = [...ticketGages];
                                      newGages[idx].gageType = e.target.value;
                                      setTicketGages(newGages);
                                    }}
                                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Micrometer"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number *</label>
                                  <input
                                    type="text"
                                    value={gage.serialNumber}
                                    onChange={(e) => {
                                      const newGages = [...ticketGages];
                                      newGages[idx].serialNumber = e.target.value;
                                      setTicketGages(newGages);
                                    }}
                                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., SLN123"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Model Number</label>
                                  <input
                                    type="text"
                                    value={gage.modelNumber}
                                    onChange={(e) => {
                                      const newGages = [...ticketGages];
                                      newGages[idx].modelNumber = e.target.value;
                                      setTicketGages(newGages);
                                    }}
                                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 234"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                                  <input
                                    type="text"
                                    value={gage.department}
                                    onChange={(e) => {
                                      const newGages = [...ticketGages];
                                      newGages[idx].department = e.target.value;
                                      setTicketGages(newGages);
                                    }}
                                    className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Tooling"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setTicketGages(prev => [
                            ...prev,
                            {
                              gageType: "",
                              serialNumber: "",
                              modelNumber: "",
                              department: user?.departments?.[0] || "",
                              priority: "MEDIUM",
                              isManual: true, // New manual gage
                            }
                          ])}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Manual Gage
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Attachments, Webcam, Video Recording */}
              <div className="space-y-6">
                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Paperclip size={16} className="text-blue-600" />
                    Attach File (PDF/Image/Video, max 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf,video/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const validFiles = [];
                      for (const file of files) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(`File "${file.name}" is too large! Max 5MB.`);
                          continue;
                        }
                        const allowedTypes = [
                          'image/',
                          'application/pdf',
                          'video/webm',
                          'video/mp4',
                          'video/quicktime' // .mov
                        ];
                        const isAllowed =
                          file.type.startsWith('image/') ||
                          file.type === 'application/pdf' ||
                          file.type.startsWith('video/');
                        if (!isAllowed) {
                          alert(`Unsupported file: "${file.name}". Only images, PDFs, and videos allowed.`);
                          continue;
                        }
                        validFiles.push(file);
                      }
                      setUploadedFiles(prev => [...prev, ...validFiles]);
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {/* File Previews */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Attachments ({uploadedFiles.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="relative group">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-16 h-16 object-cover rounded border border-gray-300"
                              />
                            ) : file.type === 'application/pdf' ? (
                              <div className="w-16 h-16 bg-red-50 rounded border border-red-200 flex items-center justify-center">
                                <span className="text-red-600 text-xs font-bold">PDF</span>
                              </div>
                            ) : file.type.startsWith('video/') ? (
                              <div className="w-16 h-16 bg-purple-50 rounded border border-purple-200 flex items-center justify-center">
                                <span className="text-purple-600 text-xs font-bold">VID</span>
                              </div>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-32 truncate">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
                      className="text-sm text-gray-500 hover:text-gray-700 underline mt-2"
                    >
                      Clear all attachments
                    </button>
                  )}
                </div>

                {/* Selected Gages Counter */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Check className="text-blue-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Selected Gages</p>
                      <p className="text-lg font-bold text-blue-900">{selectedGagesCount}</p>
                    </div>
                  </div>
                </div>

                {/* Webcam Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Camera size={16} className="text-green-600" />
                    Capture Image via Webcam
                  </label>
                  <div className="flex flex-col items-center gap-2">
                    {webcamImage ? (
                      <div className="flex flex-col items-center">
                        <img src={webcamImage} alt="Captured" className="w-48 h-48 object-contain border rounded-md mb-2" />
                        <div className="flex gap-2">
                          <Tooltip content="Retake Photo">
                            <button
                              type="button"
                              onClick={() => {
                                setWebcamImage(null);
                                // Remove the webcam file from uploadedFiles if it exists
                                setUploadedFiles(prev => prev.filter(f => f.name !== `webcam_${Date.now()}.jpg`));
                              }}
                              className="text-sm text-red-600 hover:underline flex items-center gap-1"
                            >
                              <X size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Webcam
                          audio={false}
                          ref={webcamRef} // Assign ref
                          videoConstraints={{
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: "user"
                          }}
                          width={400}
                          height={300}
                          screenshotFormat="image/jpeg"
                          screenshotQuality={0.92}
                          className="border rounded-md w-full max-w-md mx-auto"
                        />
                        <Tooltip content="Capture Photo">
                          <button
                            type="button"
                            onClick={captureWebcamImage}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-2 flex items-center gap-2"
                          >
                            <Camera size={18} />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </div>

                {/* 🎥 VIDEO + AUDIO RECORDING */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Video size={16} className="text-purple-600" />
                    Record Video with Audio (Max 30s)
                  </label>
                  <div className="flex flex-col items-center gap-2">
                    {!recordedVideoBlob ? (
                      <>
                        {isRecording ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                              <span className="text-white font-bold">●</span>
                            </div>
                            <span className="text-red-600 font-medium mt-1">Recording... {recordingTime}s</span>
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm flex items-center gap-1"
                              >
                                <X size={14} /> Stop
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={startRecording}
                              disabled={isRecording}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
                            >
                              <Video size={18} /> Start Recording
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <video
                          src={URL.createObjectURL(recordedVideoBlob)}
                          controls
                          muted={false}
                          className="w-full max-w-xs border rounded-md"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const videoFile = new File([recordedVideoBlob], `video_${Date.now()}.webm`, { type: 'video/webm' });
                              setUploadedFiles(prev => [...prev, videoFile]);
                              setRecordedVideoBlob(null);
                              setIsRecording(false);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-1"
                          >
                            <Plus size={14} /> Use Video
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordedVideoBlob(null)}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm flex items-center gap-1"
                          >
                            <X size={14} /> Retake
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-100"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTicket}
                disabled={!ticketEmail.to.trim() || !ticketEmail.subject.trim() || !ticketEmail.body.trim() || isSending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  "Send Ticket"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>

    {/* ✅ NEW: Sending Status Overlay */}
    {isSending && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-blue-200 max-w-sm w-full">
          <div className="bg-blue-100 rounded-full p-4">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          </div>
          <p className="text-gray-800 text-center font-semibold text-lg">Sending Ticket...</p>
          <p className="text-gray-500 text-sm text-center">Please wait while your ticket is being sent.</p>
        </div>
      </div>
    )}

    {/* ✅ NEW: Success Popup */}
    {showSendSuccess && (
      <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
          <div className="bg-green-100 rounded-full p-4">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-800 text-center font-semibold text-lg">Great job! ✅</p>
          <p className="text-gray-500 text-sm text-center">
            Your ticket has been sent successfully!
          </p>
        </div>
      </div>
    )}
    </>
  );
};

export default SupportTicketModal;