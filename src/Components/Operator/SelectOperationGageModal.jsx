import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import {
  Package,
  Hash,
  CalendarDays,
  FileText,
  ListOrdered,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Clock,
  AlertTriangle,
  Image,
  Download,
  Plus,
} from "lucide-react";
import {
  validateGageForUsage,
  createJobWithGageUsage,
  getGagesByType,
  getOperatorFilteredGageIssuesByPriority,
  getGages,
  isGageAvailableForReallocation,
} from "../../api/api";
import ReallocationRequestModal from "../ReallocationRequestModal";
import { useAuth } from "../../auth/AuthContext";
import Webcam from "react-webcam";


const animations = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;
// Show button if manual is a non-empty base64 string
const hasValidManual = (manual) => {
  return manual && typeof manual === 'string' && manual.startsWith('JVBER'); // PDF magic
};

{/* Helper Components */}
const InfoRow = ({ label, value }) => (
  <div className="flex flex-wrap gap-1">
    <span className="font-medium text-gray-700 min-w-fit">{label}:</span>
    <span className="text-gray-600 break-words flex-1">{value}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    ISSUED: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  };
  
  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {status || "UNKNOWN"}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    HIGH: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    LOW: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
  };
  
  const config = priorityConfig[priority] || priorityConfig.default;
  
  return (
    <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {priority || "MEDIUM"}
    </span>
  );
};


// Detail component for cleaner UI
const Detail = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:gap-2">
    <span className="font-semibold text-gray-800 w-40">{label}:</span>
    <span className="text-gray-600 break-words">{value}</span>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    purple: 'text-purple-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    teal: 'text-teal-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 text-xs font-semibold text-gray-500`}>
        <Icon size={14} className={colorClasses[color] || 'text-gray-500'} />
        {label}
      </div>
      <p className="text-lg font-bold text-gray-800">{value || 'N/A'}</p>
    </div>
  );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function SelectOperationGageModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    gageType: "",
    serialNumber: "",
    usesCount: "1",
    jobDescription: "",
    jobNumber: "",
    usageCount: "",
    usageNotes: "",
  });

  const [availableGageTypes, setAvailableGageTypes] = useState([]);
  const [availableSerials, setAvailableSerials] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState("");
  const [isValidated, setIsValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showValidationSuccess, setShowValidationSuccess] = useState(false);
const [showSubmitSuccess, setShowSubmitSuccess] = useState(false);
  const [selectedGagePriority, setSelectedGagePriority] = useState("MEDIUM");
  const [customPopup, setCustomPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    shouldCloseForm: false,
  });
  const [requestGageModalOpen, setRequestGageModalOpen] = useState(false);
const [requestGageData, setRequestGageData] = useState(null);
const [requestingGage, setRequestingGage] = useState(false);
const [previewImage, setPreviewImage] = useState(null); // 🔹 add this line at the top
const [manualPreviewOpen, setManualPreviewOpen] = useState(false);
const [showReallocationModal, setShowReallocationModal] = useState(false);
const [selectedGageForReallocation, setSelectedGageForReallocation] = useState(null);
const [ticketAttachments, setTicketAttachments] = useState([]);
const [showTicketModal, setShowTicketModal] = useState(false);
const [webcamImage, setWebcamImage] = useState(null);
const [uploadedFiles, setUploadedFiles] = useState([]); // Array of File objects
const [isCapturing, setIsCapturing] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [recordedVideoBlob, setRecordedVideoBlob] = useState(null);
const [isRecording, setIsRecording] = useState(false);
const [ticketEmail, setTicketEmail] = useState({
  to: "",
  cc: [],        // 👈 array of CC emails
  ccInput: "",   // 👈 temporary input for new CC
  subject: "",
  body: "",
});

// State for multiple gages
const [ticketGages, setTicketGages] = useState([
  {
    gageType: "",
    serialNumber: "",
    modelNumber: "",
    department: user?.departments?.[0] || "",
    priority: "MEDIUM",
    // Add other fields as needed
  }
]);
  const getRemainingUses = () => {
    const remaining = validationResult?.currentUsesCount;
    return Number.isFinite(Number(remaining)) ? Number(remaining) : 0;
  };

  const computeTotalRequestedUses = (usesCountStr) => {
    const usesCountNum = parseInt(usesCountStr || "0", 10);
    return Number.isFinite(usesCountNum) && usesCountNum > 0 ? usesCountNum : 0;
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableGageTypes();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.gageType) {
      loadAvailableSerials(formData.gageType);
    } else {
      setAvailableSerials([]);
    }
    setIsValidated(false);
    setValidationResult(null);
    setError("");
  }, [formData.gageType]);

  useEffect(() => {
  if (formData.serialNumber) {
    const gage = availableSerials.find(g => g.serialNumber === formData.serialNumber);
    if (gage) {
      const prio = (gage.priority || gage.criticality || "MEDIUM").toUpperCase();
      setSelectedGagePriority(prio);
    } else {
      setSelectedGagePriority("MEDIUM");
    }

    // ✅ Auto-validate when serial number is selected
    validateSerialNumber();
  } else {
    // Reset if no serial selected
    setIsValidated(false);
    setValidationResult(null);
    setError("");
    setSelectedGagePriority("MEDIUM");
  }
}, [formData.serialNumber, availableSerials]);

  const resetForm = () => {
    setFormData({
      gageType: "",
      serialNumber: "",
      usesCount: "1",
      jobDescription: "",
      jobNumber: "",
      usageCount: "",
      usageNotes: "",
    });
    setIsValidated(false);
    setValidationResult(null);
    setError("");
    setSelectedGagePriority("MEDIUM");
  };

  const loadAvailableGageTypes = async () => {
    try {
      setLoading(true);
      setError("");
      const assignedGages = await getOperatorFilteredGageIssuesByPriority(
        user.departments, user.functions, user.operations
      );
      const issuedTypes = [...new Set(
        assignedGages
          .filter(g => ["OPEN", "ISSUED", "ACTIVE"].includes(g.status))
          .map(g => g.title)
          .filter(Boolean)
      )].map(name => ({ name }));
      setAvailableGageTypes(issuedTypes);
    } catch (err) {
      console.error("Error loading issued gage types:", err);
      setError("Failed to load available gage types.");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSerials = async (gageTypeName) => {
    try {
      const assignedGages = await getOperatorFilteredGageIssuesByPriority(
        user.departments, user.functions, user.operations
      );
      const filteredAssigned = assignedGages.filter(
        (g) =>
          g.title === gageTypeName &&
          ["OPEN", "ISSUED", "ACTIVE"].includes(g.status) &&
          g.serialNumber
      );
      const allGages = await getGagesByType(gageTypeName);
      const serialsWithModel = filteredAssigned.map((gage) => {
        const fullGage = allGages.find((g) => g.serialNumber === gage.serialNumber);
        return { ...gage, modelNumber: fullGage?.modelNumber || "N/A" };
      });
      setAvailableSerials(serialsWithModel);
    } catch (err) {
      console.error("Error loading available serials:", err);
      setError("Failed to load available serial numbers.");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'serialNumber') {
      setIsValidated(false);
      setValidationResult(null);
      setError("");
    }
  };

  const adjustUsesCount = (delta) => {
    const current = formData.usesCount ? parseInt(formData.usesCount, 10) : 0;
    const tentative = Math.max(1, current + delta);
    const remaining = getRemainingUses();
    if (!remaining || remaining <= 0) {
      showCustomPopup(
        "No Remaining Uses",
        "This gage has no remaining uses at this time. You cannot increase Uses Count.",
        false
      );
      return;
    }
    const totalRequested = computeTotalRequestedUses(String(tentative));
    if (remaining > 0 && totalRequested > remaining) {
      showCustomPopup(
        "Exceeded Remaining Uses",
        `Uses Count (${totalRequested}) exceeds remaining uses (${remaining}). Reduce Uses Count.`,
        false
      );
      return;
    }
    handleChange("usesCount", String(tentative));
  };

  const handleUsesCountInput = (e) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    const remaining = getRemainingUses();
    if (!remaining || remaining <= 0) {
      showCustomPopup(
        "No Remaining Uses",
        "This gage has no remaining uses at this time. Uses Count cannot be changed.",
        false
      );
      return;
    }
    const totalRequested = computeTotalRequestedUses(value);
    if (value && remaining > 0 && totalRequested > remaining) {
      showCustomPopup(
        "Exceeded Remaining Uses",
        `Uses Count (${totalRequested}) exceeds remaining uses (${remaining}). Reduce Uses Count.`,
        false
      );
      return;
    }
    handleChange("usesCount", value);
  };

  const showCustomPopup = (title, message, shouldCloseForm = false) => {
    setCustomPopup({ isOpen: true, title, message, shouldCloseForm });
  };

  const validateSerialNumber = async () => {
    if (!formData.gageType || !formData.serialNumber) {
      setError("Please select a gage type and serial number.");
      return;
    }
    try {
      setValidating(true);
      setError("");
      const result = await validateGageForUsage(formData.gageType, formData.serialNumber);
      setValidationResult(result);

      const remainingUses = Number.isFinite(Number(result.currentUsesCount))
  ? Number(result.currentUsesCount)
  : 0;

// Determine the effective calibration deadline
let effectiveCalDate = result.nextCalibrationDate;
if (result.pendingCalibrationDate) {
  // Use the extended date if it's later (or only extension exists)
  const extDate = new Date(result.pendingCalibrationDate);
  const origDate = result.nextCalibrationDate ? new Date(result.nextCalibrationDate) : null;
  if (!origDate || extDate > origDate) {
    effectiveCalDate = result.pendingCalibrationDate;
  }
}

// Calculate remaining days based on effective date
const today = new Date();
const effectiveDateObj = effectiveCalDate ? new Date(effectiveCalDate) : null;
const remainingDays = effectiveDateObj
  ? Math.floor((effectiveDateObj - today) / (1000 * 60 * 60 * 24))
  : -Infinity; // Treat as expired if no date

// Now check: BOTH remainingDays > 0 AND remainingUses > 0

      let isUsable = false;
let shouldBlock = false;

if (remainingUses > 0 && remainingDays > 0) {
  isUsable = true;
} else if (remainingUses <= 0) {
  shouldBlock = true;
  showCustomPopup(
    "No Remaining Uses",
    "This gage has no remaining uses. Please return it for calibration.",
    true
  );
} else if (remainingDays <= 0) {
  shouldBlock = true;
  // Check if there was an extension (for better message)
  const hadExtension = !!result.pendingCalibrationDate;
  const extensionDate = result.pendingCalibrationDate
    ? new Date(result.pendingCalibrationDate).toLocaleDateString()
    : null;

  let message = "This gage has expired. Usage is not allowed.";
  if (hadExtension) {
    message += ` (Extended calibration date ${extensionDate} has passed.)`;
  }

  showCustomPopup(
    "Gage Expired",
    message,
    true
  );
}
      if (result.gage) {
        setSelectedGagePriority((result.gage.priority || result.gage.criticality || "MEDIUM").toUpperCase());
      }

      if (isUsable && result.isValidSerial) {
  setIsValidated(true);
  setShowValidationSuccess(true);
  setTimeout(() => setShowValidationSuccess(false), 3000);
}else if (!shouldBlock) {
        setIsValidated(false);
        setError(result.validationMessage || "Serial number validation failed.");
      }
    } catch (err) {
      console.error("Error validating gage:", err);
      setError("An unexpected error occurred during validation. Please try again.");
      setIsValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidated) {
      setError("Please validate the serial number before recording usage.");
      return;
    }
    const usesCount = parseInt(formData.usesCount, 10);
    if (isNaN(usesCount) || usesCount < 1) {
      setError("Uses Count must be a number greater than 0.");
      return;
    }
    const remaining = getRemainingUses();
    if (!remaining || remaining <= 0) {
      showCustomPopup(
        "No Remaining Uses",
        "This gage currently has 0 remaining uses. You cannot record usage.",
        false
      );
      return;
    }
    const totalRequested = Number.isFinite(usesCount) ? usesCount : 0;
    if (remaining > 0 && totalRequested > remaining) {
      showCustomPopup(
        "Exceeded Remaining Uses",
        `You requested Uses Count ${totalRequested} but only ${remaining} remain. Reduce Uses Count.`,
        false
      );
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const jobNumber = `GAGE-${Date.now()}`;
      const jobData = {
        jobNumber: jobNumber,
        jobDescription: formData.jobDescription || `Gage usage for ${formData.gageType}`,
        title: `Gage Usage - ${formData.gageType}`,
        description: `Usage recorded for ${formData.gageType} (SN: ${formData.serialNumber})`,
        priority: selectedGagePriority,
        createdBy: user.username,
        assignedTo: user.username,
        usageDate: new Date().toISOString().split('T')[0],
        department: user.departments?.[0] || null,
        functionName: user.functions?.[0] || null,
        operationName: user.operations?.[0] || null,
        gageType: formData.gageType,
        gageSerialNumber: formData.serialNumber,
        usesCount: usesCount,
        operatorUsername: user.username,
        operatorRole: user.functions?.length > 0 ? "F" : "OT",
        operatorFunction: user.functions?.[0] || null,
        operatorOperation: user.operations?.[0] || null,
        usageCount: formData.usageCount ? parseInt(formData.usageCount) : null,
        usageNotes: formData.usageNotes || null,
        tags: [],
        attachments: [],
      };
      const result = await createJobWithGageUsage(jobData);
setShowSubmitSuccess(true);
setTimeout(() => {
  setShowSubmitSuccess(false);
  onClose(); // closes the main modal
}, 2500);
    } catch (err) {
      console.error("Error recording gage usage:", err);
      setError("Failed to record gage usage. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityStyles = (priority) => {
    const p = (priority || "MEDIUM").toUpperCase();
    switch (p) {
      case "HIGH": return { icon: AlertTriangle, text: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
      case "MEDIUM": return { icon: AlertTriangle, text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
      case "LOW": return { icon: AlertTriangle, text: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
      default: return { icon: AlertTriangle, text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const priorityStyles = getPriorityStyles(selectedGagePriority);
  const PriorityIcon = priorityStyles.icon;

  // Determine validation banner style
  const getValidationBannerClass = () => {
    if (!isValidated) return "bg-red-50 border-red-400";
    if (error && error.includes("expired")) return "bg-yellow-50 border-yellow-400";
    return "bg-green-50 border-green-400";
  };

  const getValidationIcon = () => {
    if (!isValidated) return AlertCircle;
    if (error && error.includes("expired")) return AlertTriangle;
    return CheckCircle;
  };

  const getValidationTextColor = () => {
    if (!isValidated) return "text-red-800";
    if (error && error.includes("expired")) return "text-yellow-800";
    return "text-green-800";
  };

  const getValidationMessageColor = () => {
    if (!isValidated) return "text-red-700";
    if (error && error.includes("expired")) return "text-yellow-700";
    return "text-green-700";
  };

  


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

    // ✅ Explicitly request a codec that supports audio
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm'; // fallback (may still work)

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      setRecordedVideoBlob(blob);
      stream.getTracks().forEach(track => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
        setIsRecording(false);
      }
    }, 30000);
  } catch (err) {
    console.error("Error accessing camera/mic:", err);
    alert("⚠️ Camera or microphone access denied. Please allow permissions.");
  }
};

const stopRecording = () => {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    setIsRecording(false);
  }
};

const handleSendTicket = async () => {
  const toEmails = ticketEmail.to
    .split(',')
    .map(email => email.trim())
    .filter(email => email && email.includes('@'));
  if (toEmails.length === 0) {
    alert("Please enter at least one valid email in 'To'.");
    return;
  }

  // ✅ Build table from ticketGages (multi-gage support)
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
        </tr>
      </thead>
      <tbody>
        ${validGages.map(gage => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; color: #1e293b;">${gage.gageType || "—"}</td>
            <td style="padding: 10px; color: #1e293b;">${gage.serialNumber || "—"}</td>
            <td style="padding: 10px; color: #1e293b;">${gage.modelNumber || "—"}</td>
            <td style="padding: 10px; color: #1e293b;">${gage.department || "—"}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  // ✅ Full HTML email matching your backend's clean template
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
  emailData.append("html", fullHtml); // ✅ This triggers logo embedding + clean table
  uploadedFiles.forEach(file => emailData.append("attachments", file));

  try {
    const response = await fetch("http://localhost:8080/api/mail/send", {
      method: "POST",
      body: emailData,
    });
    if (response.ok) {
      alert("✅ Support ticket sent successfully!");
      setShowTicketModal(false);
      setTicketEmail({ to: "", cc: [], ccInput: "", subject: "", body: "" });
      setUploadedFiles([]);
      // ✅ Reset gage table to one empty row
      setTicketGages([
        {
          gageType: "",
          serialNumber: "",
          modelNumber: "",
          department: user?.departments?.[0] || "",
          priority: "MEDIUM"
        }
      ]);
    } else {
      let errorMsg = "Unknown error";
const responseBody = await response.text(); // Read body only once
try {
  const errorJson = JSON.parse(responseBody);
  errorMsg = errorJson.message || errorJson.error || "Failed to send email";
} catch {
  // Response is not JSON (e.g., HTML error page or plain text)
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
  }
};
const handleRequestGage = async () => {
  if (!formData.serialNumber) return;

  try {
    setRequestingGage(true);

    // Fetch gage details by serial number
    const gageArray = await getGages(formData.serialNumber);
    console.log("Gage details from API:", gageArray);

    if (!gageArray || gageArray.length === 0) {
      alert("❌ No gage details found.");
      return;
    }

    // Get the exact gage by serial number
    const gageDetails = gageArray.find(g => g.serialNumber === formData.serialNumber) || gageArray[0];

    // Also fetch gages by type to get complete information
    let gageTypeDetails = null;
    if (formData.gageType) {
      const gagesByType = await getGagesByType(formData.gageType);
      gageTypeDetails = gagesByType.find(g => g.serialNumber === formData.serialNumber);
    }

    // Combine all available data sources
    const completeGageInfo = {
      ...gageDetails,
      ...(gageTypeDetails || {}),
      // Override with form data if needed
      gageType: gageDetails.gageType?.name || formData.gageType || gageDetails.gageType || "N/A",
      serialNumber: gageDetails.serialNumber || formData.serialNumber,
    };

    const gageData = {
      // Basic Information
      gageImage: completeGageInfo.gageImage || null,
      gageType: completeGageInfo.gageType,
      serialNumber: completeGageInfo.serialNumber,
      modelNumber: completeGageInfo.modelNumber || "N/A",
      manufacturer: completeGageInfo.manufacturerName || completeGageInfo.manufacturer || "N/A",
      category: completeGageInfo.category || "N/A",
      status: completeGageInfo.status || "UNKNOWN",
      
      // Calibration Information
      nextCalibrationDate: validationResult?.nextCalibrationDate || completeGageInfo.nextCalibrationDate || "N/A",
      pendingCalibrationDate: validationResult?.pendingCalibrationDate || completeGageInfo.pendingCalibrationDate || "N/A",
      calibrationInterval: completeGageInfo.calibrationInterval || "N/A",
      remainingDays: validationResult?.remainingDays || completeGageInfo.remainingDays || "N/A",
      priority: selectedGagePriority || completeGageInfo.criticality || completeGageInfo.priority || "MEDIUM",
      
      // Technical Specifications
      maxUses: completeGageInfo.maxUses || completeGageInfo.maximumUses || "N/A",
      usageFrequency: completeGageInfo.usageFrequency || "N/A",
      
      // Usage Information
      location: completeGageInfo.location || "N/A",
      
      // Manual and Documentation
      manual: completeGageInfo.gageManual || completeGageInfo.manual || completeGageInfo.documentUrl || "N/A",
      
      // User and Department Info
      department: user?.departments?.[0] || "N/A",
      operation: user?.operations?.[0] || "N/A",
      operatorName: user?.username || "N/A",
      
      // Validation Results
      remainingUses: validationResult?.currentUsesCount || 0,
      
      // Remarks
      remarks: "Automatic Gage Request triggered due to expiry/usage limit.",
      
      // Full gage info for debugging
      fullGageInfo: completeGageInfo
    };

    console.log("Prepared gageData for modal:", gageData);

    setRequestGageData(gageData);
    setRequestGageModalOpen(true);
  } catch (err) {
    console.error("Error fetching gage details:", err);
    alert("❌ Failed to fetch gage details. Check console.");
  } finally {
    setRequestingGage(false);
  }
};

const handleRequestReallocation = async () => {
  if (!formData.serialNumber) return;

  try {
    setRequestingGage(true);

    // Fetch gage details by serial number
    const gageArray = await getGages(formData.serialNumber);
    if (!gageArray || gageArray.length === 0) {
      alert("❌ No gage details found.");
      return;
    }

    const gageDetails = gageArray.find(g => g.serialNumber === formData.serialNumber) || gageArray[0];

    // Check if gage is available for reallocation
    const isAvailable = await isGageAvailableForReallocation(gageDetails.id);
    if (!isAvailable) {
      alert("❌ This gage is not available for reallocation. It may already be allocated.");
      return;
    }

    // Set gage data for reallocation modal
    setSelectedGageForReallocation(gageDetails);
    setShowReallocationModal(true);
  } catch (err) {
    console.error("Error checking gage availability:", err);
    alert("❌ Failed to check gage availability. Please try again.");
  } finally {
    setRequestingGage(false);
  }
};
const sendGageRequestEmail = async () => {
  if (!requestGageData) return;

  try {
    setRequestingGage(true);

    // Example payload for backend
    const payload = {
      ...requestGageData,
      to: "hod@example.com",
      cc: ["supervisor@example.com", "qa@example.com"] // multiple CCs
    };

    const response = await fetch("http://localhost:8080/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to send email");

    alert("✅ Gage request email sent successfully!");
    setRequestGageModalOpen(false);
  } catch (err) {
    console.error("Error sending gage request:", err);
    alert("❌ Failed to send gage request. Check console.");
  } finally {
    setRequestingGage(false);
  }
};


  return (
    <>
  <style>{animations}</style>
  
      <Modal
  isOpen={isOpen}
  onClose={onClose}
  title={
    <div>
      <h2 className="text-xl font-bold text-white">Record Gage Usage</h2>
      {/* <p className="text-blue-100 text-sm mt-1">
        Select and validate a gage to record its usage for a job.
      </p> */}
    </div>
  }
>
  
        <form
          onSubmit={handleSubmit}
          className="bg-slate-50 px-6 sm:px-8 py-6 space-y-6 rounded-b-xl max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 w-full md:w-[650px] mx-auto"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="mt-3 text-gray-600">Loading available gages...</span>
            </div>
          ) : (
            <>
              {error && !isValidated && (
                <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="font-semibold text-red-800">An Error Occurred</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Selection & Validation */}
              <fieldset className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Package size={16} className="text-blue-600" /> Gage Type *
                    </label>
                    <select
                      value={formData.gageType}
                      onChange={(e) => handleChange("gageType", e.target.value)}
                      disabled={loading}
                      className="w-full p-2.5 rounded-md border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                    >
                      <option value="">Select a type...</option>
                      {availableGageTypes.map((type) => (
                        <option key={type.name} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                      <Hash size={16} className="text-orange-600" /> Serial Number *
                    </label>
                    <select
                      value={formData.serialNumber}
                      onChange={(e) => handleChange("serialNumber", e.target.value)}
                      disabled={!formData.gageType}
                      className="w-full p-2.5 rounded-md border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-gray-100"
                    >
                      <option value="">Select a serial...</option>
                      {availableSerials.map((gage) => (
                        <option key={gage.id} value={gage.serialNumber}>
                          {gage.serialNumber} ({gage.modelNumber || 'No Model'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* <div>
                  <button
                    type="button"
                    onClick={validateSerialNumber}
                    disabled={!formData.serialNumber || validating || isValidated}
                    className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition font-semibold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {validating ? (
                      <><Loader2 className="animate-spin" size={20} /> Validating...</>
                    ) : isValidated ? (
                      <><CheckCircle size={20} /> Validated</>
                    ) : "Validate Serial Number"}
                  </button>
                </div> */}
              </fieldset>

              {/* Step 2: Validation Results */}
              {validationResult && (
                <div className="space-y-4 border-t pt-4">
                  {/* Removed the top row of StatCards for Priority and Extended Cal. */}
                  {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StatCard icon={PriorityIcon} label="Priority" value={selectedGagePriority} color={priorityStyles.text.split('-')[1]} />
                    <StatCard icon={CalendarDays} label="Extended Cal." value={formatDate(validationResult.pendingCalibrationDate)} color="teal" />
                  </div> */}

                  {validationResult.isValidSerial && (
                    <div className={cn("border-l-4 rounded-r-lg p-4 bg-green-50 shadow-sm", getValidationBannerClass())}>
                      <div className="flex items-start gap-3">
                        {React.createElement(getValidationIcon(), {
                          className: cn(
                            !isValidated ? "text-red-500" :
                            error && error.includes("expired") ? "text-yellow-500" : "text-green-500",
                            "mt-0.5"
                          ),
                          size: 20
                        })}
                        <div className="flex-1">
                          <p className={cn("font-semibold", getValidationTextColor())}>
                            {!isValidated
                              ? 'Validation Failed'
                              : error && error.includes("expired")
                              ? 'Usage Allowed with Warning'
                              : 'Validation Successful'}
                          </p>
                          <p className={cn("text-sm", getValidationMessageColor())}>
                            {error || validationResult.validationMessage}
                          </p>
                        </div>
                      </div>

                      {/* NEW: Add Priority and Extended Cal. info here */}
                      <div className="mt-3 pt-1 border-t border-green-200/30 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <PriorityIcon size={32} className={`${priorityStyles.text} bg-white/60 p-1.5 rounded-full`} />
                          <span>Priority: <strong className={`text-gray-800 ${priorityStyles.text}`}>{selectedGagePriority}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarDays size={32} className="text-teal-600 bg-white/60 p-1.5 rounded-full" />
                          <span>Extended Cal.: <strong className="text-gray-800">{formatDate(validationResult.pendingCalibrationDate) || 'N/A'}</strong></span>
                        </div>
                      </div>

                      {/* Original Remaining Days and Next Calibration */}
                      <div className="mt-3 pt-3 border-t border-green-200/30 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock size={16} className="text-blue-500" />
                          <span>Remaining Days: <strong className="text-gray-800">{validationResult.remainingDays ?? 'N/A'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarDays size={16} className="text-green-600" />
                          <span>Next Calibration: <strong className="text-gray-800">{formatDate(validationResult.nextCalibrationDate)}</strong></span>
                        </div>
                        {/* Keep the extended cal. date in the original spot if needed, or remove it if you prefer the new one above */}
                        {/* {validationResult.pendingCalibrationDate && (
                          <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                            <AlertTriangle size={16} className="text-teal-600" />
                            <span>Extended Calibration Date: <strong className="text-gray-800">{formatDate(validationResult.pendingCalibrationDate)}</strong></span>
                          </div>
                        )} */}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Usage Details */}
              {isValidated && (
                <fieldset className="space-y-4 border-t pt-5">
                  {/* Removed the separate "Gage Usage Status" section */}
                  {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">Gage Usage Status</h3>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Remaining Uses:</span> {getRemainingUses()}
                        </p>
                      </div>
                      {validationResult && getRemainingUses() <= 0 && (
                        <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 border border-red-300 rounded-full">
                          No Uses Left
                        </span>
                      )}
                    </div>
                  </div> */}
                  {/* END REMOVED SECTION */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      {/* NEW: Integrated Remaining Uses into the label */}
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2 flex-wrap">
                        <Users size={16} className="text-purple-600 flex-shrink-0" /> Use Count *
                        <span className="text-md font-semibold text-gray-900 bg-purple-200 px-2 py-0.5 rounded-full">
                          Remaining Uses: <span className="font-semibold text-purple-900 ">{getRemainingUses()}</span>
                        </span>
                      </label>
                      {/* END NEW LABEL */}
                      <div className="flex">
                        <button
                          type="button"
                          onClick={() => adjustUsesCount(-1)}
                          disabled={!validationResult?.currentUsesCount || validationResult?.currentUsesCount <= 0}
                          className="px-3 bg-gray-200 text-gray-700 rounded-l-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.usesCount}
                          onChange={handleUsesCountInput}
                          disabled={!validationResult?.currentUsesCount || validationResult?.currentUsesCount <= 0}
                          className="w-full p-2.5 border-y border-gray-300 text-center shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 z-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={() => adjustUsesCount(1)}
                          disabled={!validationResult?.currentUsesCount || validationResult?.currentUsesCount <= 0}
                          className="px-3 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      {validationResult && (!validationResult.currentUsesCount || validationResult.currentUsesCount <= 0) && (
                        <p className="mt-1 text-xs text-red-600">No remaining uses available for this gage.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                        <ListOrdered size={16} className="text-red-600" /> Ref Job Code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.usageCount}
                        onChange={(e) => handleChange("usageCount", e.target.value)}
                        className="w-full p-2.5 rounded-md border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                      <FileText size={16} className="text-green-600" />Ref Job Description
                    </label>
                    <input
                      type="text"
                      value={formData.jobDescription}
                      onChange={(e) => handleChange("jobDescription", e.target.value)}
                      className="w-full p-2.5 rounded-md border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Optional: e.g. Inspecting Part #XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes</label>
                    <textarea
                      value={formData.usageNotes}
                      onChange={(e) => handleChange("usageNotes", e.target.value)}
                      className="w-full p-2.5 rounded-md border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                      rows={3}
                      placeholder="Optional: e.g. Gage showed minor drift on last reading"
                    />
                  </div>
                </fieldset>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition font-semibold disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValidated || submitting}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition font-semibold flex items-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="animate-spin" size={18} /> Recording...</>
              ) : "Record Usage"}
            </button>
          </div>
        </form>
      </Modal>
     {/* Custom Popup Modal */}
{customPopup.isOpen && (
  <Modal
    isOpen={customPopup.isOpen}
    onClose={() => setCustomPopup({ ...customPopup, isOpen: false })}
    title={customPopup.title}
    className="max-w-sm w-full mx-4"
  >
    <div className="p-5 text-center">
      <p className="text-gray-700 mb-6">{customPopup.message}</p>

      {/* OK button (full-width for simple alerts) */}
      {!(customPopup.title === "Gage Expired" || customPopup.title === "No Remaining Uses") ? (
        <button
          onClick={() => {
            setCustomPopup({ ...customPopup, isOpen: false });
            if (customPopup.shouldCloseForm) onClose();
          }}
          className="max-w-[500px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
        >
          OK
        </button>
      ) : (
        /* ✅ Horizontal buttons: smaller, lighter, side-by-side */
        <div className="flex justify-center gap-2">
          <button
            onClick={handleRequestGage}
            className="px-3 py-2 text-md font-medium bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
          >
            View and Request
          </button>
          <button
            onClick={handleRequestReallocation}
            className="px-3 py-2 text-md font-medium bg-amber-400 text-white rounded-md hover:bg-amber-500 transition"
          >
            Replacement/Standby
          </button>
        </div>
      )}
    </div>
  </Modal>
)}

{requestGageModalOpen && requestGageData && (
  <Modal
    isOpen={requestGageModalOpen}
    onClose={() => setRequestGageModalOpen(false)}
    title="Send Request for New Gage"
    className="max-w-4xl w-full mx-2 sm:mx-4 md:mx-6 lg:mx-auto"
  >
    <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
      {/* Basic Info & Image */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Package size={16} className="text-blue-600" /> Basic Information
          </h3>
          <div className="space-y-2.5 text-sm">
            <InfoRow label="Serial Number" value={requestGageData.serialNumber} />
            <InfoRow label="Model Number" value={requestGageData.modelNumber} />
            <InfoRow label="Gage Type" value={requestGageData.gageType} />
            <InfoRow label="Category" value={requestGageData.category} />
            <InfoRow label="Manufacturer" value={requestGageData.manufacturer} />
            <InfoRow label="Department" value={requestGageData.department} />
            <InfoRow label="Operation" value={requestGageData.operation} />
            <InfoRow label="Operator" value={requestGageData.operatorName} />
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <StatusBadge status={requestGageData.status} />
            </div>
          </div>
        </div>

        {/* Gage Image */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Image size={16} className="text-gray-600" /> Gage Image
            </h3>
            {requestGageData.gageImage ? (
              <div className="flex justify-center">
                <img
                  src={`data:image/jpeg;base64,${requestGageData.gageImage}`}
                  alt={`${requestGageData.gageType} Image`}
                  className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => setPreviewImage(`data:image/jpeg;base64,${requestGageData.gageImage}`)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 sm:h-40 md:h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <span className="text-gray-400 text-sm">No Image Available</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calibration Information */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <CalendarDays size={16} className="text-green-600" /> Calibration Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
          <InfoRow label="Next Calibration Date" value={formatDate(requestGageData.nextCalibrationDate)} />
          <InfoRow label="Pending Calibration Date" value={formatDate(requestGageData.pendingCalibrationDate)} />
          <InfoRow label="Calibration Interval" value={requestGageData.calibrationInterval} />
          <InfoRow label="Remaining Days" value={requestGageData.remainingDays?.toString()} />
          <div className="sm:col-span-2">
            <span className="font-medium text-gray-700">Criticality:</span>
            <PriorityBadge priority={requestGageData.priority} />
          </div>
        </div>
      </div>

      {/* Technical & Usage Info - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Technical Specifications */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
          <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <ListOrdered size={16} className="text-purple-600" /> Technical Specifications
          </h3>
          <div className="space-y-2.5 text-sm">
            <InfoRow label="Max Uses (Total Allowed)" value={requestGageData.maxUses?.toString()} />
            <InfoRow label="Usage Frequency" value={requestGageData.usageFrequency} />
            <InfoRow label="Location" value={requestGageData.location} />
            {/* Add more if available in your API */}
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200 shadow-sm">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <Users size={16} className="text-yellow-600" /> Usage Summary
          </h3>
          <div className="space-y-2.5 text-sm">
            <InfoRow label="Remaining Uses" value={requestGageData.remainingUses?.toString() || "0"} />
            <InfoRow label="Max Uses (Total)" value={requestGageData.maxUses?.toString() || "N/A"} />
            {/* You can add current usage count if tracked */}
          </div>
        </div>
      </div>
      
      {/* Remarks */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText size={16} className="text-gray-600" /> Remarks
        </h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {requestGageData.remarks}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
        {requestGageData.manual &&
  requestGageData.manual !== "N/A" &&
  requestGageData.manual.trim() !== "" &&
  !requestGageData.manual.startsWith("N/A") && (
  <button
    onClick={(e) => {
      e.preventDefault();
      setManualPreviewOpen(true);
    }}
    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 shadow hover:shadow-md transition"
  >
    <Download size={16} /> View Manual
  </button>
)}
        <button
          onClick={() => setRequestGageModalOpen(false)}
          className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium shadow hover:shadow transition"
        >
          Close
        </button>

        <button
              onClick={handleRequestReallocation}
              className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-semibold transition"
            >
              Replacement/Standby
            </button>
      </div>
      
    </div>

    {/* Image Preview */}
    {previewImage && (
      <div
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        onClick={() => setPreviewImage(null)}
      >
        <div className="relative max-w-full max-h-[85vh]">
          <img
            src={previewImage}
            alt="Gage Preview"
            className="max-h-[80vh] max-w-[95vw] sm:max-w-[85vw] md:max-w-[75vw] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-3 right-3 bg-black bg-opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-80"
          >
            ✕
          </button>
        </div>
      </div>
    )}
  </Modal>
)}
{/* 📘 Manual PDF Preview Modal */}
{manualPreviewOpen && requestGageData?.manual && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
    <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] h-[85vh] flex flex-col overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📄 Gage Manual
        </h2>
        <button
          onClick={() => setManualPreviewOpen(false)}
          className="text-white hover:text-gray-200 transition text-xl font-bold"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-50">
        <iframe
          src={`data:application/pdf;base64,${requestGageData.manual}`}
          className="w-full h-full rounded-b-2xl"
          title="Gage Manual Preview"
          onError={() => alert("⚠️ Failed to load PDF. The file may be invalid or corrupted.")}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center px-6 py-4 border-t bg-white">
        <p className="text-sm text-gray-600">
          Viewing manual for: <span className="font-semibold text-gray-800">{requestGageData?.gageType}</span>
        </p>
        <button
          onClick={() => setManualPreviewOpen(false)}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* Reallocation Request Modal */}
<ReallocationRequestModal
  isOpen={showReallocationModal}
  onClose={() => {
    setShowReallocationModal(false);
    setSelectedGageForReallocation(null);
  }}
  gageData={selectedGageForReallocation}
  onSuccess={(result) => {
    console.log('Reallocation request created:', result);
    alert('✅ Reallocation request submitted successfully!');
    setShowReallocationModal(false);
    setSelectedGageForReallocation(null);
  }}
/>
// ... [all previous imports and code remain unchanged until showTicketModal] ... 
{showTicketModal && (
  <Modal
    isOpen={true}
    onClose={() => setShowTicketModal(false)}
    title="Generate Support Ticket"
    className="w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto"
  >
    <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
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
              className="w-full p-2.5 rouexamplended-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Add Gage Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Gage(s) to Ticket</h3>
            <div className="space-y-3">
              {ticketGages.map((gage, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">Gage #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setTicketGages(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-800 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Gage Type</label>
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Serial Number</label>
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
              ))}
              <button
                type="button"
                onClick={() => setTicketGages(prev => [
                  ...prev,
                  {
                    gageType: "",
                    serialNumber: "",
                    modelNumber: "",
                    department: user?.departments?.[0] || "",
                    priority: "MEDIUM"
                  }
                ])}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Another Gage
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Attachments, Webcam, Video Recording */}
        <div className="space-y-6">
          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 Attach File (PDF/Image/Video, max 5MB)
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

          {/* Webcam Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Capture Image via Webcam
            </label>
            {webcamImage ? (
              <div className="flex flex-col items-center">
                <img src={webcamImage} alt="Captured" className="w-48 h-48 object-contain border rounded-md mb-2" />
                <button type="button" onClick={() => setWebcamImage(null)} className="text-sm text-red-600 hover:underline">
                  Retake Photo
                </button>
              </div>
            ) : (
              <Webcam
  audio={false}
  // Request HD resolution from the camera
  videoConstraints={{
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: "user"
  }}
  // Render preview at reasonable size (doesn't affect capture quality)
  width={400}
  height={300}
  // Capture high-quality JPEG
  screenshotFormat="image/jpeg"
  screenshotQuality={0.92}
  className="border rounded-md w-full max-w-md mx-auto"
>
                {({ getScreenshot }) => (
                  <button
                    type="button"
                    onClick={() => {
                      const imageSrc = getScreenshot();
                      if (imageSrc) {
                        const webcamFile = dataURLtoFile(imageSrc, `webcam_${Date.now()}.jpg`);
                        setUploadedFiles(prev => [...prev, webcamFile]);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-2"
                  >
                    Capture Photo
                  </button>
                )}
              </Webcam>
            )}
          </div>

          {/* 🎥 VIDEO + AUDIO RECORDING */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎥 Record Video with Audio (Max 30s)
            </label>
            <div className="flex flex-col items-center gap-2">
              {!recordedVideoBlob ? (
                <>
                  {isRecording ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white font-bold">●</span>
                      </div>
                      <span className="text-red-600 font-medium mt-1">Recording...</span>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded text-sm"
                      >
                        Stop Recording
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isRecording}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      Start Recording
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <video
  src={URL.createObjectURL(recordedVideoBlob)}
  controls
  muted={false}  // ✅ Critical: allow audio
  className="w-full max-w-xs border rounded-md"
/>
                  <div className="flex gap-2 mt-2">
                    <button
  type="button"
  onClick={() => {
    const videoFile = new File([recordedVideoBlob], `video_${Date.now()}.webm`, { type: 'video/webm' });
    console.log("Adding video file:", videoFile.name, "Type:", videoFile.type); // 👈 ADD THIS
    setUploadedFiles(prev => [...prev, videoFile]);
    setRecordedVideoBlob(null);
    setIsRecording(false);
  }}
  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
>
  Use This Video
</button>
                    <button
                      type="button"
                      onClick={() => setRecordedVideoBlob(null)}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm"
                    >
                      Retake
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
          onClick={() => setShowTicketModal(false)}
          className="px-4 py-2 text-gray-700 bg-white border rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSendTicket}
          disabled={!ticketEmail.to.trim() || !ticketEmail.subject.trim() || !ticketEmail.body.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
        >
          Send Ticket
        </button>
      </div>
    </div>
  </Modal>
)}

{/* ✅ Validation Success Popup (Gage Ready) */}
{showValidationSuccess && (
  <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300">
    <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
      <div className="bg-green-100 rounded-full p-4">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <p className="text-gray-800 text-center font-semibold text-lg">Happy working day! 🎯</p>
      <p className="text-gray-500 text-sm text-center">Your gage is all set and ready to go.</p>
    </div>
  </div>
)}

{/* ✅ Submission Success Popup (Record Usage) */}
{showSubmitSuccess && (
  <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300">
    <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-green-200 animate-fadeIn max-w-sm w-full">
      <div className="bg-green-100 rounded-full p-4">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <p className="text-gray-800 text-center font-semibold text-lg">Great job! ✅</p>
      <p className="text-gray-500 text-sm text-center">
        You have submitted successfully!<br/>
        Thank you for completing this job!
      </p>
    </div>
  </div>
)}

    </>
  );
}

