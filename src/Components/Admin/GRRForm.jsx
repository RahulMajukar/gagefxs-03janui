// src/components/Admin/GRRForm.jsx
import React, { useState, useEffect, useRef } from "react";
import InputField from "../../form/InputField";
import {
  Calculator,
  RefreshCw,
  X,
  Save,
  QrCode,
  Key,
  Camera,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  Scan,
} from "lucide-react";
import api from "../../api/axios";
import GRRResults from "./GRRResults";
import GRRCharts from "./GRRCharts";
import HTFimage from "../../assets/HTF.png";
import { calculateAppraiserStats, calculateOverallStats } from "../../utils/grrCalculations";
import jsQR from "jsqr";
// Import JSON icons
import qrIcon from "../../assets/qr.json";
import serialNoIcon from "../../assets/serialno.json";
import successAnimation from "../../assets/success.json";
import errorAnimation from "../../assets/Error.json"; // Import the error animation
// 👇 Import Lottie
import Lottie from "lottie-react";

const UNITS = ["mm", "inch", "μm", "cm", "in"];
const CHARACTERISTICS = [
  "Pitch Diameter",
  "Outside Diameter",
  "Inside Diameter",
  "Length",
  "Width",
  "Height",
  "Thickness",
  "Concentricity",
  "Roundness",
  "Surface Finish"
];

// ────────────────────────────────────────────────
//          QR Scanner Component (using jsQR)
// ────────────────────────────────────────────────
const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const Button = ({ children, onClick, variant = "primary", icon: Icon, className = "", disabled = false }) => {
    const base = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    };
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md active:scale-[0.98]";
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${disabledStyle} ${className}`}
      >
        {Icon && React.isValidElement(Icon) ? Icon : Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  const startCamera = async () => {
    try {
      setLoading(true);
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
      setLoading(false);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or not available. Please allow permissions.");
      setLoading(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let scanFrameId;
    let detectionHandled = false;
    const scan = () => {
      if (!isScanning || detectionHandled || !videoRef.current || !canvasRef.current) {
        return;
      }
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code?.data) {
          detectionHandled = true;
          console.log("QR Code detected:", code.data);
          onScan(code.data.trim());
          stopCamera();
          return;
        }
      }
      scanFrameId = requestAnimationFrame(scan);
    };
    if (isScanning) {
      scan();
    }
    const timeout = setTimeout(() => {
      if (isScanning && !detectionHandled) {
        setError("Could not detect QR code. Try better lighting or manual entry.");
        stopCamera();
      }
    }, 45000);
    return () => {
      if (scanFrameId) cancelAnimationFrame(scanFrameId);
      clearTimeout(timeout);
    };
  }, [isScanning, onScan]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan Gage QR Code
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        <div className="border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center mb-4 overflow-hidden bg-black relative">
          {loading ? (
            <div className="text-center p-4">
              <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
              <p className="text-gray-300">Starting camera...</p>
            </div>
          ) : isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-blue-500 animate-pulse rounded-lg"></div>
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                Scanning...
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300">Camera not available</p>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <Button
            onClick={isScanning ? stopCamera : startCamera}
            variant={isScanning ? "secondary" : "primary"}
            className="w-full"
            disabled={loading}
          >
            {isScanning ? "Stop Scanning" : "Start Camera"}
          </Button>
          <Button
            onClick={() => {
              const serial = prompt("Enter gage serial number:");
              if (serial?.trim()) onScan(serial.trim());
            }}
            variant="outline"
            className="w-full"
          >
            Enter Serial Manually
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full">
            Cancel
          </Button>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p className="flex items-center justify-center gap-1">
            <Scan className="w-3 h-3" />
            Point camera at gage QR code
          </p>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
//          Pre-Scan Modal Component (Professional Classic UI)
// ────────────────────────────────────────────────
const PreScanModal = ({ onClose, onSerialNumber }) => {
  const [manualSerial, setManualSerial] = useState("");
  const [scanMode, setScanMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const Button = ({ children, onClick, variant = "primary", icon: Icon, className = "", disabled = false }) => {
    const base = "px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    };
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md active:scale-[0.98]";
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${disabledStyle} ${className}`}
      >
        {Icon && React.isValidElement(Icon) ? Icon : Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  // Parse QR data to extract serial number from URL or raw data
  const parseQrData = (qrData) => {
    let serial = qrData?.trim() || "";
    if (qrData && qrData.includes('http')) {
      try {
        if (qrData.includes('serial=') || qrData.includes('sn=') || qrData.includes('id=')) {
          const url = new URL(qrData);
          const params = new URLSearchParams(url.search);
          const serialParam = params.get('serial') || params.get('sn') || params.get('id') || params.get('serialNumber');
          if (serialParam) {
            serial = serialParam;
          }
        }
        if (serial === qrData.trim()) {
          const pathParts = qrData.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && !lastPart.includes('?') && !lastPart.includes('.')) {
            serial = lastPart;
          }
        }
      } catch (e) {
        console.log('Not a valid URL, using raw data:', e.message);
      }
    }
    return serial;
  };

  const handleQrScanSuccess = (qrData) => {
    if (!qrData?.trim()) return;
    const serialNumber = parseQrData(qrData);
    console.log('QR Data:', qrData, 'Extracted Serial:', serialNumber);
    if (serialNumber) {
      onSerialNumber(serialNumber);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualSerial.trim()) {
      alert("Please enter a serial number");
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/gages/serial/${encodeURIComponent(manualSerial.trim())}`);
      if (response.data) {
        onSerialNumber(manualSerial.trim());
      }
    } catch (error) {
      console.error('Gage fetch error:', error);
      alert(`Gage not found: ${manualSerial}. Please check the serial number.`);
    } finally {
      setLoading(false);
    }
  };

  if (scanMode === "qr") {
    return <QRScanner onScan={handleQrScanSuccess} onClose={() => setScanMode(null)} />;
  }

  if (scanMode === "manual") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Enter Gage Serial Number</h3>
            <button onClick={() => setScanMode(null)} className="text-gray-500 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">

            <input
              type="text"
              value={manualSerial}
              onChange={(e) => setManualSerial(e.target.value)}
              placeholder="Enter gage serial number..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
              autoFocus
              onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setScanMode(null)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              disabled={!manualSerial.trim() || loading}
              className="flex-1"
              icon={loading ? Loader2 : Check}
            >
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Increased width to 700px */}
      <div className="bg-white rounded-xl p-8 w-[700px] h-[700px] max-w-full mx-4 shadow-xl border border-gray-200">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Scan Gage For GR&R study</h3>
        </div>


        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* QR Code Option */}
          <button
            onClick={() => setScanMode("qr")}
            className="group flex flex-col items-center text-center p-5 rounded-xl border border-gray-400 hover:border-blue-700 hover:shadow-md transition-all duration-200"
          >
            <div className="w-50 h-50 mb-4 flex items-center justify-center">
              <Lottie
                animationData={qrIcon}
                loop={true}
                autoplay={true}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
            <span className="font-semibold text-gray-800 text-lg group-hover:text-blue-700">Scan QR Code</span>
            <p className="text-sm text-gray-600 mt-1">Use camera to scan gage QR code</p>
          </button>

          {/* Serial Number Option */}
          <button
            onClick={() => setScanMode("manual")}
            className="group flex flex-col items-center text-center p-5 rounded-xl border border-gray-400 hover:border-blue-700 hover:shadow-md transition-all duration-200"
          >
            <div className="w-50 h-50 mb-4 flex items-center justify-center">
              <Lottie
                animationData={serialNoIcon}
                loop={true}
                autoplay={true}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
            <span className="font-semibold text-gray-800 text-lg group-hover:text-blue-700">Enter Gage Serial Number</span>
            <p className="text-sm text-gray-600 mt-1">Type the gage serial number manually</p>
          </button>
        </div>
        {/* Blue Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className=" font-medium text-blue-800 ">Please scan or enter the gage serial number</p>
              <p className="text-sm text-blue-600 mt-1">This will auto-fill gage details in the GR&R form</p>
            </div>
          </div>
        </div>
        {/* Cancel Button */}
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </Button>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <span className="inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Scanning helps ensure accurate gage tracking
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
//       Updated Error Popup Component for existing GR&R
// ────────────────────────────────────────────────
const ErrorPopup = ({ gageNumber, gageData, onClose, onBackToStudy, onBackToScan }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-[600px] max-w-full mx-4 shadow-xl border border-gray-200">
        {/* Large Error Animation */}
        <div className="w-74 h-74 mx-auto mb-6">
          <Lottie
            animationData={errorAnimation}
            loop={true}
            autoplay={true}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
        
        {/* Error Message */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-red-600 mb-4">GR&R Study Already Exists!</h3>
          <p className="text-gray-700 mb-3 text-lg">
            A Variable GR&R Study Report already exists for this gage:
          </p>
          <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4 mb-4">
            <p className="font-bold text-xl">Gage Number: <span className="text-blue-700">{gageNumber}</span></p>
          </div>
          <p className="text-gray-600">
            You can create duplicate GR&R studies for the same gage number.
          </p>
        </div>

        {/* Buttons - Back to Study and Back to Scan */}
        <div className="flex gap-4">
                    <button
            onClick={onBackToScan}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 text-lg"
          >
            Back to Scan
          </button>
          <button
            onClick={onBackToStudy}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 text-lg"
          >
            Again Study
          </button>

        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
//                  Main GRRForm Component
// ────────────────────────────────────────────────
const GRRForm = ({ onGRRAdded, onClose, gages = [] }) => {
  const [showPreScan, setShowPreScan] = useState(true);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [existingGageNumber, setExistingGageNumber] = useState("");
  const [existingGageData, setExistingGageData] = useState(null);
  const [gageData, setGageData] = useState(null);
  const [form, setForm] = useState({
    studyName: "",
    gageNumber: "",
    partNumber: "",
    partName: "",
    characteristic: "Pitch Diameter",
    lowerSpecification: 5.24,
    upperSpecification: 5.28,
    units: "mm",
    numberOfAppraisers: 3,
    numberOfParts: 10,
    numberOfTrials: 3,
    studyDate: new Date().toISOString().split("T")[0],
    conductedBy: "Soumik Mukherjee",
    companyName: "HIGH TENSILE FASTNUTS (I) PVT LTD",
    reportTitle: "Variable GR&R Study Report",
    documentNumber: "QC/23",
    revisionNumberDate: "02/01.11.15",
    pageInfo: "01 OF 01",
    notes: "",
    measurementData: {},
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [calculationResults, setCalculationResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [savedStudy, setSavedStudy] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Check if GR&R study already exists for a gage number
  const checkExistingGRR = async (gageNumber) => {
    try {
      console.log('Checking existing GR&R for gage number:', gageNumber);
      
      // First try to get gage by serial number
      const gageResponse = await api.get(`/gages/serial/${encodeURIComponent(gageNumber)}`);
      let gageInfo = null;
      
      if (gageResponse.data && gageResponse.data.id) {
        gageInfo = gageResponse.data;
        // Check if GR&R exists for this gage
        const grrResponse = await api.get(`/grr/gage/${gageResponse.data.id}`);
        
        if (grrResponse.data && grrResponse.data.length > 0) {
          console.log('Existing GR&R study found:', grrResponse.data);
          return { exists: true, gage: gageInfo };
        }
      }
      
      // Also check by gage number in GR&R studies directly
      const allGRRResponse = await api.get('/grr');
      const existingGRR = allGRRResponse.data.find(
        study => study.gageNumber === gageNumber
      );
      
      return { 
        exists: !!existingGRR, 
        gage: gageInfo || null 
      };
    } catch (error) {
      console.error('Error checking existing GR&R:', error);
      // If there's an error, assume no existing GR&R
      return { exists: false, gage: null };
    }
  };

  const handleSerialNumber = async (serialNumber) => {
    try {
      setLoading(true);
      console.log('Processing serial number:', serialNumber);
      const cleanSerial = serialNumber.trim();
      
      // Check if GR&R already exists for this gage number
      const { exists, gage } = await checkExistingGRR(cleanSerial);
      
      if (exists) {
        // Show error popup with existing gage data
        setExistingGageNumber(cleanSerial);
        setExistingGageData(gage);
        setShowErrorPopup(true);
        setShowPreScan(false);
        return;
      }
      
      // No existing GR&R, check if gage exists
      if (gage) {
        // Gage exists but no GR&R study, auto-fill form with gage data
        setGageData(gage);
        setForm(prev => ({
          ...prev,
          studyName: gage.gageType?.name || gage.modelNumber || gage.name || "GRR Study",
          gageNumber: gage.serialNumber || cleanSerial,
        }));
        setShowPreScan(false);
      } else {
        // Gage doesn't exist, auto-fill with serial number
        setForm(prev => ({
          ...prev,
          studyName: "New Gage - " + cleanSerial,
          gageNumber: cleanSerial,
        }));
        setShowPreScan(false);
      }
      
    } catch (error) {
      console.error("Error processing serial number:", error);
      // If error occurs, still proceed with the serial number
      setForm(prev => ({
        ...prev,
        studyName: "New Gage - " + serialNumber.trim(),
        gageNumber: serialNumber.trim()
      }));
      setShowPreScan(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle back from error popup - Back to Study
  const handleBackToStudy = () => {
    setShowErrorPopup(false);
    // Auto-fill the form with existing gage data
    if (existingGageData) {
      setForm(prev => ({
        ...prev,
        studyName: existingGageData.gageType?.name || existingGageData.modelNumber || existingGageData.name || "GRR Study",
        gageNumber: existingGageData.serialNumber || existingGageNumber,
      }));
    } else {
      // If no gage data, still fill the form with the gage number
      setForm(prev => ({
        ...prev,
        studyName: "GRR Study - " + existingGageNumber,
        gageNumber: existingGageNumber,
      }));
    }
  };

  // Handle back from error popup - Back to Scan
  const handleBackToScan = () => {
    setShowErrorPopup(false);
    setShowPreScan(true);
  };

  // Fixed Button component
  const Button = ({ children, onClick, variant = "primary", icon, className = "", disabled = false, type = "button" }) => {
    const base = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700",
      success: "bg-green-600 text-white hover:bg-green-700",
    };
    const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md active:scale-[0.98]";
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} ${variants[variant]} ${disabledStyle} ${className}`}
      >
        {icon && React.isValidElement(icon) ? icon : icon && React.createElement(icon, { className: "w-4 h-4" })}
        {children}
      </button>
    );
  };

  // Initialize measurements when parameters change
  useEffect(() => {
    const initializeMeasurements = () => {
      const { numberOfAppraisers, numberOfParts, numberOfTrials } = form;
      const measurementData = {};
      for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
        const appraiserKey = appraiserNum.toString();
        measurementData[appraiserKey] = {};
        for (let partIndex = 1; partIndex <= numberOfParts; partIndex++) {
          const partKey = partIndex.toString();
          measurementData[appraiserKey][partKey] = {};
          for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
            const trialKey = trialIndex.toString();
            measurementData[appraiserKey][partKey][trialKey] = "";
          }
        }
      }
      setForm(prev => {
        const updatedMeasurementData = { ...measurementData };
        Object.keys(prev.measurementData || {}).forEach(appraiserKey => {
          if (updatedMeasurementData[appraiserKey]) {
            Object.keys(prev.measurementData[appraiserKey] || {}).forEach(partKey => {
              if (updatedMeasurementData[appraiserKey][partKey]) {
                Object.keys(prev.measurementData[appraiserKey][partKey] || {}).forEach(trialKey => {
                  if (updatedMeasurementData[appraiserKey][partKey][trialKey] !== undefined) {
                    const value = prev.measurementData[appraiserKey][partKey][trialKey];
                    if (value !== "" && value !== null && value !== undefined) {
                      updatedMeasurementData[appraiserKey][partKey][trialKey] = value;
                    }
                  }
                });
              }
            });
          }
        });
        return {
          ...prev,
          measurementData: updatedMeasurementData
        };
      });
    };
    initializeMeasurements();
  }, [form.numberOfAppraisers, form.numberOfParts, form.numberOfTrials]);

  const validateField = (name, value) => {
    const requiredFields = [
      "studyName",
      "gageNumber",
      "partNumber",
      "partName",
      "characteristic",
      "lowerSpecification",
      "upperSpecification",
      "numberOfAppraisers",
      "numberOfParts",
      "numberOfTrials",
      "studyDate"
    ];
    if (requiredFields.includes(name) && !value && value !== 0) {
      return "This field is required.";
    }
    if ((name === "lowerSpecification" || name === "upperSpecification") && isNaN(parseFloat(value))) {
      return "Enter a valid number.";
    }
    if (name === "upperSpecification" && parseFloat(value) <= parseFloat(form.lowerSpecification)) {
      return "Must be greater than lower specification.";
    }
    if (["numberOfAppraisers", "numberOfParts", "numberOfTrials"].includes(name)) {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue <= 0) {
        return "Must be a positive number.";
      }
      if (name === "numberOfAppraisers" && numValue > 10) {
        return "Maximum 10 appraisers allowed.";
      }
      if (name === "numberOfParts" && numValue > 50) {
        return "Maximum 50 parts allowed.";
      }
      if (name === "numberOfTrials" && numValue > 10) {
        return "Maximum 10 trials allowed.";
      }
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      "lowerSpecification",
      "upperSpecification",
      "numberOfAppraisers",
      "numberOfParts",
      "numberOfTrials"
    ];
    const processedValue = numericFields.includes(name) ?
      (value === "" ? "" : parseFloat(value)) :
      value;
    setForm(prev => ({
      ...prev,
      [name]: processedValue
    }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, processedValue)
    }));
    if (calculationResults) {
      setCalculationResults(null);
      setShowResults(false);
    }
  };

  const handleMeasurementChange = (appraiserIndex, partIndex, trialIndex, value) => {
    const appraiserKey = (appraiserIndex + 1).toString();
    const partKey = (partIndex + 1).toString();
    const trialKey = (trialIndex + 1).toString();
    const updatedMeasurementData = { ...form.measurementData };
    if (!updatedMeasurementData[appraiserKey]) {
      updatedMeasurementData[appraiserKey] = {};
    }
    if (!updatedMeasurementData[appraiserKey][partKey]) {
      updatedMeasurementData[appraiserKey][partKey] = {};
    }
    updatedMeasurementData[appraiserKey][partKey][trialKey] =
      value === "" || isNaN(value) ? "" : parseFloat(value);
    setForm(prev => ({
      ...prev,
      measurementData: updatedMeasurementData
    }));
    if (calculationResults) {
      setCalculationResults(null);
      setShowResults(false);
    }
  };

  const validateMeasurements = () => {
    const { measurementData, numberOfAppraisers, numberOfParts, numberOfTrials } = form;
    let isValid = true;
    for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
      const appraiserKey = appraiserNum.toString();
      const appraiserData = measurementData[appraiserKey] || {};
      for (let partIndex = 1; partIndex <= numberOfParts; partIndex++) {
        const partKey = partIndex.toString();
        const partData = appraiserData[partKey] || {};
        for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
          const trialKey = trialIndex.toString();
          const value = partData[trialKey];
          if (value === "" || value === null || value === undefined || isNaN(value)) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;
      }
      if (!isValid) break;
    }
    return isValid;
  };

  // AUTO-FILL DUMMY DATA with random values between Lower and Upper Specification
  const fillDummyData = () => {
    const {
      numberOfAppraisers,
      numberOfParts,
      numberOfTrials,
      lowerSpecification,
      upperSpecification
    } = form;
    const lower = parseFloat(lowerSpecification);
    const upper = parseFloat(upperSpecification);
    if (isNaN(lower) || isNaN(upper) || lower >= upper) {
      setErrors(prev => ({
        ...prev,
        measurements: "Please set valid Lower and Upper Specifications first"
      }));
      return;
    }
    const dummyMeasurements = {};
    const range = upper - lower;
    for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
      const appraiserKey = appraiserNum.toString();
      dummyMeasurements[appraiserKey] = {};
      for (let partIndex = 1; partIndex <= numberOfParts; partIndex++) {
        const partKey = partIndex.toString();
        dummyMeasurements[appraiserKey][partKey] = {};
        for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
          const trialKey = trialIndex.toString();
          const randomValue = lower + (Math.random() * range);
          const roundedValue = Math.round(randomValue * 1000) / 1000;
          dummyMeasurements[appraiserKey][partKey][trialKey] = roundedValue;
        }
      }
    }
    setForm(prev => ({
      ...prev,
      measurementData: dummyMeasurements
    }));
    setErrors(prev => ({ ...prev, measurements: "" }));
    setCalculationResults(null);
    setShowResults(false);
  };

  // CALCULATE GR&R USING BACKEND API
  const calculateGRR = async () => {
    try {
      setLoading(true);
      if (!validateMeasurements()) {
        setErrors(prev => ({
          ...prev,
          measurements: "Please fill all measurement values"
        }));
        setLoading(false);
        return;
      }
      setErrors(prev => ({ ...prev, measurements: "" }));
      const calculationRequest = {
        studyName: form.studyName || form.gageNumber,
        gageNumber: form.gageNumber,
        partNumber: form.partNumber,
        partName: form.partName,
        characteristic: form.characteristic,
        lowerSpecification: parseFloat(form.lowerSpecification),
        upperSpecification: parseFloat(form.upperSpecification),
        units: form.units,
        numberOfAppraisers: parseInt(form.numberOfAppraisers),
        numberOfParts: parseInt(form.numberOfParts),
        numberOfTrials: parseInt(form.numberOfTrials),
        measurementData: form.measurementData,
        notes: form.notes,
        studyDate: form.studyDate,
        conductedBy: form.conductedBy,
        companyName: form.companyName,
        reportTitle: form.reportTitle,
        documentNumber: form.documentNumber,
        revisionNumberDate: form.revisionNumberDate,
        pageInfo: form.pageInfo
      };
      const response = await api.post("/grr/calculate", calculationRequest);
      const results = response.data;
      setCalculationResults(results);
      setShowResults(true);
    } catch (err) {
      console.error("GR&R Calculation API Error:", err);
      setErrors(prev => ({
        ...prev,
        calculation: "Failed to calculate GR&R. Please check your data and try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  // SAVE GR&R STUDY TO DATABASE
  const saveGRRStudy = async () => {
    try {
      if (!calculationResults) {
        setErrors(prev => ({
          ...prev,
          save: "Please calculate GR&R first before saving."
        }));
        return;
      }
      
      // Check again if GR&R already exists before saving
      const { exists } = await checkExistingGRR(form.gageNumber);
      if (exists) {
        setErrors(prev => ({
          ...prev,
          save: `A GR&R study already exists for gage number: ${form.gageNumber}. Cannot create duplicate.`
        }));
        return;
      }
      
      setLoading(true);
      const cleanedMeasurementData = {};
      Object.entries(form.measurementData).forEach(([appraiserKey, appraiserData]) => {
        cleanedMeasurementData[appraiserKey] = {};
        Object.entries(appraiserData).forEach(([partKey, partData]) => {
          cleanedMeasurementData[appraiserKey][partKey] = {};
          Object.entries(partData).forEach(([trialKey, value]) => {
            cleanedMeasurementData[appraiserKey][partKey][trialKey] =
              value === "" ? null : parseFloat(value);
          });
        });
      });
      const grrStudyData = {
        studyName: form.studyName || form.gageNumber,
        gageNumber: form.gageNumber,
        partNumber: form.partNumber,
        partName: form.partName,
        characteristic: form.characteristic,
        lowerSpecification: parseFloat(form.lowerSpecification),
        upperSpecification: parseFloat(form.upperSpecification),
        units: form.units,
        numberOfAppraisers: parseInt(form.numberOfAppraisers),
        numberOfParts: parseInt(form.numberOfParts),
        numberOfTrials: parseInt(form.numberOfTrials),
        measurementData: cleanedMeasurementData,
        notes: form.notes,
        studyDate: form.studyDate,
        conductedBy: form.conductedBy,
        companyName: form.companyName,
        reportTitle: form.reportTitle,
        documentNumber: form.documentNumber,
        revisionNumberDate: form.revisionNumberDate,
        pageInfo: form.pageInfo
      };
      const response = await api.post("/grr", grrStudyData);
      const savedStudy = response.data;
      setSavedStudy(savedStudy);
      setErrors(prev => ({ ...prev, save: "" }));
      if (onGRRAdded) {
        onGRRAdded(savedStudy);
      }

      // 👇 Show success animation instead of alert
      setShowSuccessModal(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onClose) onClose();
      }, 2000);
    } catch (err) {
      console.error("GR&R Save API Error:", err);
      setErrors(prev => ({
        ...prev,
        save: `Failed to save GR&R study: ${err.response?.data?.message || err.message}`
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderMeasurementTable = () => {
    const { numberOfAppraisers, numberOfParts, numberOfTrials, measurementData } = form;
    const overallStats = calculateOverallStats(measurementData, numberOfAppraisers, numberOfParts, numberOfTrials);
    return (
      <div className="space-y-6">
        {Array.from({ length: numberOfAppraisers }, (_, appraiserIndex) => {
          const appraiserNum = appraiserIndex + 1;
          const appraiserKey = appraiserNum.toString();
          const appraiserMeasurements = measurementData[appraiserKey] || {};
          const stats = calculateAppraiserStats(measurementData, appraiserNum, numberOfParts, numberOfTrials);
          const isOutOfControl = overallStats.outOfControlAppraisers.includes(appraiserNum);
          return (
            <div key={`appraiser-${appraiserNum}`} className="border border-gray-300 rounded-lg overflow-hidden">
              <div className={`px-4 py-2 border-b border-gray-300 ${isOutOfControl ? 'bg-red-100' : 'bg-gray-100'}`}>
                <h4 className={`font-semibold ${isOutOfControl ? 'text-red-800' : 'text-gray-800'}`}>
                  Appraiser #{appraiserNum}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-300">
                      <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-700">Trial #</th>
                      {Array.from({ length: numberOfParts }, (_, partIndex) => (
                        <th key={`part-${partIndex}`} className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                          Part {partIndex + 1}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Average</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-700">Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: numberOfTrials }, (_, trialIndex) => {
                      const trialNum = trialIndex + 1;
                      const trialKey = trialNum.toString();
                      const trialValues = [];
                      return (
                        <tr key={`trial-${trialIndex}`} className="border-b border-gray-200">
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900">
                            Trial {trialNum}
                          </td>
                          {Array.from({ length: numberOfParts }, (_, partIndex) => {
                            const partNum = partIndex + 1;
                            const partKey = partNum.toString();
                            const partMeasurements = appraiserMeasurements[partKey] || {};
                            const value = partMeasurements[trialKey] || "";
                            if (value !== "" && !isNaN(value)) {
                              trialValues.push(parseFloat(value));
                            }
                            return (
                              <td key={`part-${partIndex}`} className="border border-gray-300 px-2 py-1">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={value}
                                  onChange={(e) =>
                                    handleMeasurementChange(appraiserIndex, partIndex, trialIndex, e.target.value)
                                  }
                                  className="w-16 px-1 py-0.5 border border-gray-300 rounded text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                            );
                          })}
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                            {trialValues.length > 0 ?
                              (trialValues.reduce((a, b) => a + b, 0) / trialValues.length).toFixed(3) :
                              "—"
                            }
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center">
                            {trialValues.length > 1 ?
                              (Math.max(...trialValues) - Math.min(...trialValues)).toFixed(3) :
                              "—"
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-400">
                      <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900">Average</td>
                      {Array.from({ length: numberOfParts }, (_, partIndex) => (
                        <td key={`part-avg-${partIndex}`} className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                          {stats.partAverages[partIndex] !== null ? stats.partAverages[partIndex].toFixed(3) : "—"}
                        </td>
                      ))}
                      <td className={`border border-gray-300 px-3 py-2 text-sm text-center font-semibold ${isOutOfControl ? 'text-red-600' : 'text-gray-700'}`}>
                        {stats.overallAverage.toFixed(2)}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-sm text-gray-700 font-semibold ${isOutOfControl ? 'text-red-600' : ''}`}>
                        X{String.fromCharCode(96 + appraiserNum)}={stats.overallAverage.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900">Range</td>
                      {Array.from({ length: numberOfParts }, (_, partIndex) => (
                        <td key={`part-range-${partIndex}`} className="border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                          {stats.partRanges[partIndex] !== null ? stats.partRanges[partIndex].toFixed(3) : "—"}
                        </td>
                      ))}
                      <td className={`border border-gray-300 px-3 py-2 text-sm text-center font-semibold ${isOutOfControl ? 'text-red-600' : 'text-gray-700'}`}>
                        {stats.overallRange.toFixed(2)}
                      </td>
                      <td className={`border border-gray-300 px-3 py-2 text-sm text-gray-700 font-semibold ${isOutOfControl ? 'text-red-600' : ''}`}>
                        r{String.fromCharCode(96 + appraiserNum)}={stats.overallRange.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
        {/* Average of Appraiser Average Section */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100 border-b-2 border-yellow-400">
                  <th className="border border-yellow-400 px-3 py-2 text-left text-xs font-semibold text-gray-700">Average of Appraiser Average</th>
                  {Array.from({ length: numberOfParts }, (_, partIndex) => (
                    <th key={`part-${partIndex}`} className="border border-yellow-400 px-3 py-2 text-center text-xs font-semibold text-gray-700">
                      Part {partIndex + 1}
                    </th>
                  ))}
                  <th className="border border-yellow-400 px-3 py-2 text-center text-xs font-semibold text-gray-700">X</th>
                  <th className="border border-yellow-400 px-3 py-2 text-center text-xs font-semibold text-gray-700">Rp</th>
                </tr>
              </thead>
              <tbody>
                {/* Range Row - showing range of appraiser averages for each part */}
                <tr>
                  <td className="border border-yellow-400 px-3 py-2 text-sm font-semibold text-gray-900 bg-blue-50">Range</td>
                  {Array.from({ length: numberOfParts }, (_, partIndex) => {
                    const appraiserAverages = [];
                    for (let appraiserNum = 1; appraiserNum <= numberOfAppraisers; appraiserNum++) {
                      const appraiserKey = appraiserNum.toString();
                      const appraiserData = measurementData[appraiserKey] || {};
                      const partKey = (partIndex + 1).toString();
                      const partData = appraiserData[partKey] || {};
                      const values = [];
                      for (let trialIndex = 1; trialIndex <= numberOfTrials; trialIndex++) {
                        const trialKey = trialIndex.toString();
                        const value = partData[trialKey];
                        if (value !== "" && !isNaN(value) && value !== null && value !== undefined) {
                          values.push(parseFloat(value));
                        }
                      }
                      if (values.length > 0) {
                        const avg = values.reduce((a, b) => a + b, 0) / values.length;
                        appraiserAverages.push(avg);
                      }
                    }
                    const rangeOfAverages = appraiserAverages.length > 1
                      ? Math.max(...appraiserAverages) - Math.min(...appraiserAverages)
                      : 0;
                    return (
                      <td key={`range-${partIndex}`} className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-medium bg-blue-50">
                        {rangeOfAverages.toFixed(3)}
                      </td>
                    );
                  })}
                  <td className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-semibold bg-blue-50">
                    {overallStats.R.toFixed(2)}
                  </td>
                  <td className="border border-yellow-400 px-3 py-2 text-sm text-blue-700 text-center font-semibold bg-blue-50">
                    r{String.fromCharCode(96 + numberOfAppraisers)}={overallStats.appraiserOverallRanges[numberOfAppraisers - 1]?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                {/* Average Row */}
                <tr>
                  <td className="border border-yellow-400 px-3 py-2 text-sm font-semibold text-gray-900">Average</td>
                  {Array.from({ length: numberOfParts }, (_, partIndex) => (
                    <td key={`avg-${partIndex}`} className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-medium">
                      {overallStats.averageOfAppraiserAverages[partIndex] !== null
                        ? overallStats.averageOfAppraiserAverages[partIndex].toFixed(3)
                        : "—"}
                    </td>
                  ))}
                  <td className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-semibold">
                    {overallStats.X.toFixed(2)}
                  </td>
                  <td className="border border-yellow-400 px-3 py-2 text-sm text-gray-900 text-center font-semibold">
                    {overallStats.Rp.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Out of Control Status, Note, and Statistics */}
          <div className="bg-yellow-50 border-t-2 border-yellow-400 p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left Side: OUT OF CONTROL Box and Note */}
              <div className="flex-1 flex items-start gap-4">
                {/* OUT OF CONTROL Box */}
                {overallStats.outOfControlAppraisers.length > 0 && (
                  <>
                    <div className="border-2 border-green-600 px-0 py-0 bg-white flex items-center relative">
                      {/* Inner black border section for APPRAISER */}
                      <div className="border-r border-black px-3 py-2 flex items-center">
                        <span className="text-red-600 font-bold text-sm">APPRAISER</span>
                      </div>
                      <div className="px-3 py-2 flex items-center gap-2 flex-1">
                        <span className="text-red-600 font-bold text-base">
                          {overallStats.outOfControlAppraisers.map(num => String.fromCharCode(64 + num)).join(", ")} OUT OF CONTROL
                        </span>
                        <span className="text-red-600 text-lg ml-auto">▶</span>
                      </div>
                    </div>
                    {/* Note */}
                    <div className="text-red-600 text-xs italic flex-1 max-w-md">
                      Note: If any appraiser is "Out of Control" Repeat these readings using the same appraiser and unit as originally used or discard values and re-average and recompute R and the limiting value from the remaining observations.
                    </div>
                  </>
                )}
              </div>
              {/* Right Side: Statistics in vertical stack - Always visible */}
              <div className="flex flex-col border border-black bg-white min-w-[120px]">
                {/* R= row */}
                <div className="flex items-center border-b border-black px-3 py-2">
                  <span className="text-blue-700 font-semibold mr-2">▶</span>
                  <span className="text-blue-700 font-semibold mr-2">R=</span>
                  <span className="text-black font-bold">{overallStats.R.toFixed(2)}</span>
                </div>
                {/* XDIFF= row */}
                <div className="flex items-center border-b border-black px-3 py-2">
                  <span className="text-blue-700 font-semibold mr-2">▶</span>
                  <span className="text-blue-700 font-semibold mr-2">XDIFF=</span>
                  <span className="text-black font-bold">{overallStats.XDIFF.toFixed(2)}</span>
                </div>
                {/* UCLR= row */}
                <div className="flex items-center px-3 py-2">
                  <span className="text-blue-700 font-semibold mr-2">▶</span>
                  <span className="text-blue-700 font-semibold mr-2">UCLR=</span>
                  <span className="text-black font-bold">{overallStats.UCLR.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  // Show PreScan modal
  if (showPreScan) {
    return <PreScanModal onClose={onClose} onSerialNumber={handleSerialNumber} />;
  }

  // Show Error popup if GR&R already exists
  if (showErrorPopup) {
    return (
      <ErrorPopup 
        gageNumber={existingGageNumber}
        gageData={existingGageData}
        onClose={onClose}
        onBackToStudy={handleBackToStudy}
        onBackToScan={handleBackToScan}
      />
    );
  }

  // Show the main GRR form
  return (
    <div className="fixed inset-0 flex justify-center items-start bg-black bg-opacity-40 z-50 overflow-y-auto">
      <div className="w-full max-w-[95%] bg-white rounded-lg shadow-2xl border border-gray-200 my-4">
        {/* Header matching image format */}
        <div className="bg-white border-b-2 border-gray-400 px-6 py-4">
          <div className="flex justify-end items-center mb-4">
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            )}
          </div>
          <div className="w-full border bg-gray-200 border-black text-sm" >
            <div className="grid grid-cols-12">
              <div className="col-span-3 border-r border-black p-2 flex items-center justify-center font-bold">
                <div className="flex items-center gap-3 text-center">
                  {/* Company Name */}
                  <div className="leading-tight text-left p-4 text-base">
                    <div>HIGH TENSILE</div>
                    <div>FASTNUTS (I) PVT LTD</div>
                  </div>
                  {/* Logo */}
                  <img
                    src={HTFimage}
                    alt="HTF Logo"
                    className="h-12 w-auto object-contain"
                  />
                </div>
              </div>
              {/* Center: Report Title with Image */}
              <div className="col-span-6 border-r border-black flex items-center justify-center gap-3 font-bold text-xl">
                <span>Variable GR&amp;R Study Report</span>
              </div>
              {/* Right: Document Info */}
              <div className="col-span-3 text-xs">
                <div className="border-b border-black p-1">
                  <span className="font-semibold">DOC NO.:</span>{" "}
                  {form.documentNumber || "QC/23"}
                </div>
                <div className="border-b border-black p-1">
                  <span className="font-semibold">REV NO./DT.:</span>{" "}
                  {form.revisionNumberDate || `02/${getTodayDate()}`}
                </div>
                <div className="p-1">
                  <span className="font-semibold">PAGE:</span>{" "}
                  {form.pageInfo || "01 OF 01"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
            {/* Study Parameters Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-gray-300 p-4 rounded-lg bg-gray-50">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Part Name*</label>
                <InputField
                  label=""
                  name="partName"
                  value={form.partName}
                  onChange={handleChange}
                  error={errors.partName}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Part Number*</label>
                <InputField
                  label=""
                  name="partNumber"
                  value={form.partNumber}
                  onChange={handleChange}
                  error={errors.partNumber}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Characteristic</label>
                <select
                  name="characteristic"
                  value={form.characteristic}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {CHARACTERISTICS.map(char => (
                    <option key={char} value={char}>{char}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Specification</label>
                <div className="flex items-center gap-1 text-sm">
                  <InputField
                    label=""
                    type="number"
                    step="0.001"
                    name="lowerSpecification"
                    value={form.lowerSpecification}
                    onChange={handleChange}
                    className="w-20 text-sm"
                  />
                  <span>-</span>
                  <InputField
                    label=""
                    type="number"
                    step="0.001"
                    name="upperSpecification"
                    value={form.upperSpecification}
                    onChange={handleChange}
                    className="w-20 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gage Name*</label>
                <InputField
                  label=""
                  name="studyName"
                  value={form.studyName}
                  onChange={handleChange}
                  error={errors.studyName}
                  placeholder="Micrometer"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gage Number</label>
                <InputField
                  label=""
                  name="gageNumber"
                  value={form.gageNumber}
                  onChange={handleChange}
                  error={errors.gageNumber}
                  className="text-sm bg-gray-50"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lower Specification</label>
                <InputField
                  label=""
                  type="number"
                  step="0.001"
                  name="lowerSpecification"
                  value={form.lowerSpecification}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upper Specification</label>
                <InputField
                  label=""
                  type="number"
                  step="0.001"
                  name="upperSpecification"
                  value={form.upperSpecification}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date Performed</label>
                <InputField
                  label=""
                  type="date"
                  name="studyDate"
                  value={form.studyDate}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">No. of Trials</label>
                <select
                  name="numberOfTrials"
                  value={form.numberOfTrials}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {[2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">No. of Parts</label>
                <select
                  name="numberOfParts"
                  value={form.numberOfParts}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">No. of Appraiser</label>
                <select
                  name="numberOfAppraisers"
                  value={form.numberOfAppraisers}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {[2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Conducted By</label>
                <InputField
                  label=""
                  name="conductedBy"
                  value={form.conductedBy}
                  onChange={handleChange}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Measurement Data Table */}
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Measurement Data</h3>
                <button
                  type="button"
                  onClick={fillDummyData}
                  className="px-4 py-2 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 hover:border-blue-500 transition-colors duration-200 flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Fill Random Dummy Data
                </button>
              </div>
              {renderMeasurementTable()}
            </div>

            {/* Error Display */}
            {errors.measurements && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{errors.measurements}</p>
              </div>
            )}
            {errors.calculation && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{errors.calculation}</p>
              </div>
            )}

            {/* Calculate Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={calculateGRR}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                {loading ? "Calculating..." : "Calculate GR&R"}
              </button>
            </div>
          </form>

          {/* Results Section - Display inline */}
          {showResults && calculationResults && (
            <div className="mt-8 space-y-6">
              <GRRResults
                results={calculationResults}
                formData={form}
              />
              <GRRCharts
                results={calculationResults}
                formData={form}
              />
              {/* Save Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {errors.save && (
                  <div className="flex-1 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm">{errors.save}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={saveGRRStudy}
                  disabled={loading || savedStudy !== null}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : savedStudy ? "Saved ✓" : "Save Study"}
                </button>
              </div>
            </div>
          )}

          {/* Success Animation Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 flex flex-col items-center">
                <div className="w-32 h-32">
                  <Lottie
                    animationData={successAnimation}
                    loop={false}
                    autoplay={true}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-800">GR&R study saved successfully!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GRRForm;