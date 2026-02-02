import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera, Search, X, Download, Printer, AlertCircle,
  Tag, Archive, MapPin, Calendar, Clock, Info,
  FileText, ShieldCheck, BarChart, Flame,
  BadgeCheck, Users, CheckCircle, Loader2,
  Scan, Upload
} from "lucide-react";
import { scanGageByBarcode, scanGageByBarcodeImage } from "../../api/api";
import Quagga from '@ericblade/quagga2';
import jsQR from 'jsqr';

const GageScanner = ({ onClose, onScanResult }) => {
  const [scanMode, setScanMode] = useState("camera"); // "camera", "manual", "upload"
  const [codeType, setCodeType] = useState('barcode'); // 'barcode' or 'qrcode'
  const [manualSerial, setManualSerial] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isScanningRef = useRef(false);
  const quaggaInitializedRef = useRef(false);
  const navigate = useNavigate();

  // Enhanced cleanup functions
  const stopQuaggaStream = useCallback(() => {
    console.log("Stopping Quagga stream...");
    
    // First, manually stop the video stream if present
    const container = document.querySelector('#scanner-container');
    if (container) {
      const video = container.querySelector('video');
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped Quagga video track:", track.kind);
        });
        video.srcObject = null;
        video.pause();
      }
      container.innerHTML = '';
    }
    
    if (Quagga && Quagga.initialized) {
      try {
        Quagga.offDetected();
        Quagga.stop();
        quaggaInitializedRef.current = false;
        console.log("Quagga stopped successfully");
      } catch (err) {
        console.error("Error stopping Quagga:", err);
      }
    }
  }, []);

  const stopQRCamera = useCallback(() => {
    console.log("Stopping QR camera...");
    isScanningRef.current = false;
    
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => {
          track.stop();
          console.log("Stopped QR video track:", track.kind);
        });
        videoRef.current.srcObject = null;
      }
      videoRef.current.pause();
      videoRef.current.load(); // Reset video element
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped stream track:", track.kind);
      });
      streamRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log("Stopping all cameras...");
    stopQuaggaStream();
    stopQRCamera();
  }, [stopQuaggaStream, stopQRCamera]);

  // Enhanced cleanup on unmount and mode change
  useEffect(() => {
    return () => {
      console.log("Component unmounting - cleaning up cameras");
      stopCamera();
    };
  }, [stopCamera]);

  // Handle scan mode changes with proper cleanup
  useEffect(() => {
    console.log("Scan mode or result changed:", { scanMode, hasResult: !!scanResult });
    
    if (scanMode === "camera" && !scanResult) {
      if (codeType === 'barcode') {
        initializeBarcodeCamera();
      } else {
        initializeQRCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      // Cleanup when switching between camera modes
      if (scanMode === "camera") {
        stopCamera();
      }
    };
  }, [scanMode, codeType, scanResult, stopCamera]);

  const initializeBarcodeCamera = useCallback(async () => {
    console.log("Initializing barcode camera...");
    
    // Stop QR camera if active
    stopQRCamera();

    try {
      // Clean up any existing Quagga instance
      if (Quagga.initialized) {
        stopQuaggaStream();
      }

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector('#scanner-container'),
          constraints: {
            facingMode: "environment",
            width: 640,
            height: 480
          },
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader"
          ],
          debug: false
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
      }, (err) => {
        if (err) {
          
          return;
        }
        Quagga.start();
        quaggaInitializedRef.current = true;
        console.log("Quagga started successfully");
      });

      let detectionHandled = false;
      
      Quagga.onDetected((data) => {
        if (detectionHandled) return;
        detectionHandled = true;
        
        const code = data.codeResult.code;
        console.log("✅ Barcode detected:", code);
        
        // Stop camera immediately and process result
        stopQuaggaStream();
        fetchGageDetails(code.trim());
      });

    } catch (err) {
      console.error("Barcode Camera init error:", err);
      setError("Camera access denied or unsupported for barcode.");
    }
  }, [stopQRCamera, stopQuaggaStream]);

  const initializeQRCamera = useCallback(async () => {
    console.log("Initializing QR camera...");
    
    // Stop Quagga if active
    stopQuaggaStream();

    try {
      // Ensure clean start
      stopQRCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      await videoRef.current.play();

      isScanningRef.current = true;
      let detectionHandled = false;

      const tick = () => {
        if (!isScanningRef.current || detectionHandled) {
          return;
        }
        
        const video = videoRef.current;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && !detectionHandled) {
            detectionHandled = true;
            console.log("✅ QR code detected:", code.data);
            
            // Stop camera immediately
            stopQRCamera();
            
            const raw = code.data.trim();
            // Always navigate within app; extract serial even if QR is a URL
            const match = raw.match(/serial(number)?\s*=\s*([^&\s]+)/i);
            const serialFromParam = match && match[2] ? match[2].trim() : null;
            const serial = serialFromParam || raw;
            
            navigate(`/scan?serial=${encodeURIComponent(serial)}`, { replace: true });
            return;
          }
        }
        requestAnimationFrame(tick);
      };
      
      tick();
    } catch (err) {
      console.error("QR Camera init error:", err);
      setError("Camera access denied or unsupported for QR code.");
    }
  }, [stopQuaggaStream, stopQRCamera, navigate]);

  const handleManualScan = async () => {
    if (!manualSerial.trim()) {
      setError("Please enter a serial number");
      return;
    }
    await fetchGageDetails(manualSerial.trim());
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    setScanResult(null);

    try {
      if (codeType === 'qrcode') {
        // Decode QR locally and navigate with serial only
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(imageData.data, imageData.width, imageData.height);
            if (result && result.data) {
              const raw = result.data.trim();
              const match = raw.match(/serial(number)?\s*=\s*([^&\s]+)/i);
              const serial = (match && match[2] ? match[2].trim() : raw);
              navigate(`/scan?serial=${encodeURIComponent(serial)}`, { replace: true });
            } else {
              setError('Unable to decode QR code image');
            }
            setLoading(false);
          };
          img.onerror = () => {
            setError('Invalid image file');
            setLoading(false);
          };
          img.src = reader.result;
        };
        reader.onerror = () => {
          setError('Failed to read image file');
          setLoading(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Barcode path: use backend to decode and fetch
      console.log('Uploading barcode image...');
      const data = await scanGageByBarcodeImage(file);
      console.log('Upload response:', data);
      if (data && data.success) {
        setScanResult(data);
        // Stop camera if it was active
        stopCamera();
      } else {
        setError(data?.message || 'Failed to decode barcode or gage not found');
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || err.message || `Failed to process ${codeType} image`);
    } finally {
      setLoading(false);
      setUploadedFile(null);
    }
  };

  const extractSerial = (raw) => {
    if (!raw) return "";
    const text = String(raw).trim();
    try {
      // If complete URL, parse query params
      if (text.startsWith("http://") || text.startsWith("https://")) {
        const url = new URL(text);
        const qp = url.searchParams;
        const s = qp.get("serial") || qp.get("serialnumber") || qp.get("sn");
        if (s) return s.trim();
      }
    } catch (_) {}
    // Handle patterns like "serialnumber=123" within plain text
    const match = text.match(/serial(number)?\s*=\s*([^&\s]+)/i);
    if (match && match[2]) return match[2].trim();
    return text; // fallback: assume raw serial
  };

  const fetchGageDetails = async (serialNumber) => {
    setLoading(true);
    setError("");
    setScanResult(null);
   
    try {
      const normalized = extractSerial(serialNumber);
      console.log(`Fetching gage details for ${codeType}:`, normalized, "(raw:", serialNumber, ")");
      const data = await scanGageByBarcode(normalized);
      console.log("Scan response:", data);
     
      if (data && data.success) {
        setScanResult(data);
        // Stop camera immediately after successful scan
        stopCamera();
        if (onScanResult) onScanResult(data);
      } else {
        setError(data?.message || "Gage not found or invalid response");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch gage details. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewScan = () => {
    stopCamera();
    setScanResult(null);
    setManualSerial("");
    setUploadedFile(null);
    setError("");
    setScanMode("camera");
  };

  const handleModeChange = (mode) => {
    stopCamera();
    setScanMode(mode);
    setManualSerial("");
    setUploadedFile(null);
    setError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      handleImageUpload(file);
    }
  };

  const handleClose = () => {
    console.log("Closing scanner - cleaning up...");
    stopCamera();
    if (onClose) onClose();
    window.location.reload();
  };

  const renderToggle = (title = "Scan Type") => (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setCodeType('barcode')}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            codeType === 'barcode'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Barcode
        </button>
        <button
          onClick={() => setCodeType('qrcode')}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            codeType === 'qrcode'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          QR Code
        </button>
      </div>
    </div>
  );

  const renderModeButtons = () => (
    <div className="flex gap-3 mb-6">
      <button
        onClick={() => handleModeChange("camera")}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          scanMode === "camera"
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <Camera size={20} />
        Scanner
      </button>
      <button
        onClick={() => handleModeChange("manual")}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          scanMode === "manual"
            ? "bg-green-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <Search size={20} />
        Serial Number
      </button>
      <button
        onClick={() => handleModeChange("upload")}
        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          scanMode === "upload"
            ? "bg-purple-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
        }`}
      >
        <Upload size={20} />
        Upload
      </button>
    </div>
  );

  const renderCameraScan = () => (
    <div className="space-y-4">
      {renderToggle("Scan Type")}

      <div className="relative bg-gray-900 rounded-lg overflow-hidden h-64">
        {codeType === 'barcode' ? (
          <div id="scanner-container" className="w-full h-full" />
        ) : (
          <>
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`border-2 border-green-400 animate-pulse relative ${codeType === 'barcode' ? 'w-64 h-32' : 'w-64 h-64'}`}>
            <div className="absolute -top-8 left-0 right-0 text-center">
              <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                Align {codeType} within frame
              </span>
            </div>
          </div>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg flex items-center gap-2">
              <Loader2 className="animate-spin text-blue-600" size={20} />
              <span>Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
          disabled={true}
        >
          <Camera size={20} />
          Scanning in Progress...
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          <strong>Tip:</strong> Ensure good lighting and hold steady for better {codeType} recognition
        </p>
      </div>
    </div>
  );

  const renderManualEntry = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Enter the gage serial number to view all details
        </p>
      </div>
     
      <div className="flex gap-2">
        <input
          type="text"
          value={manualSerial}
          onChange={(e) => setManualSerial(e.target.value)}
          placeholder="Enter gage serial number..."
          className="flex-1 border border-gray-300 rounded px-3 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
          disabled={loading}
        />
        <button
          onClick={handleManualScan}
          disabled={loading || !manualSerial.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-lg min-w-[120px] justify-center"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Search size={20} />
          )}
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> Make sure the serial number matches exactly as recorded in the system
          </p>
        </div>
      </div>
    </div>
  );

  const renderUploadScreen = () => (
    <div className="space-y-4">
      {renderToggle("Upload Type")}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Upload a clear image of the gage {codeType} (PNG, JPG, JPEG)
        </p>
      </div>
     
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
        <Upload className="text-gray-400" size={48} />
        <p className="mt-2 text-gray-600">Click to upload or drag and drop</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={loading}
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <p className="text-yellow-700 text-sm">
            <strong>Tip:</strong> Ensure the {codeType} is clear, well-lit, and not blurry for best results
          </p>
        </div>
      </div>
    </div>
  );

  const renderScanResults = () => {
    const scannedImageKey = codeType === 'barcode' ? 'barcodeImage' : 'qrCodeImage';
    const scannedImage = scanResult?.[scannedImageKey];
    const scannedType = codeType === 'barcode' ? 'Barcode' : 'QR Code';

    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <h3 className="text-green-800 font-semibold">Gage Found Successfully!</h3>
              <p className="text-green-600 text-sm">
                {scannedType} scanned at: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleNewScan}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Scan size={18} />
              New Scan
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                <Tag className="text-yellow-600" size={24} />
                Serial Number
              </h3>
              <p className="text-3xl font-mono font-bold text-yellow-900 mt-2">
                {scanResult.serialNumber || "N/A"}
              </p>
            </div>
            {scannedImage && (
              <img
                src={`data:image/png;base64,${scannedImage}`}
                alt={`${scannedType}`}
                className="h-20"
              />
            )}
          </div>
        </div>

        {scanResult.gageImage && (
          <div className="flex justify-center">
            <img
              src={`data:image/jpeg;base64,${scanResult.gageImage}`}
              alt={scanResult.modelNumber || "Gage"}
              className="max-w-sm max-h-64 object-cover rounded-lg border shadow-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
            <DetailField icon={FileText} label="Model Number" value={scanResult.modelNumber} />
            <DetailField icon={BarChart} label="Category" value={scanResult.category} />
            <DetailField icon={ShieldCheck} label="Manufacturer" value={scanResult.manufacturerName} />
            <DetailField icon={Archive} label="Measurement Range" value={scanResult.measurementRange} />
            <DetailField icon={CheckCircle} label="Accuracy" value={scanResult.accuracy} />
            <DetailField icon={Calendar} label="Purchase Date" value={scanResult.purchaseDate} />
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Calibration & Usage</h3>
            <DetailField
              icon={BadgeCheck}
              label="Calibration Interval"
              value={scanResult.calibrationInterval ? `${scanResult.calibrationInterval} months` : "N/A"}
            />
            <DetailField icon={Calendar} label="Next Calibration" value={scanResult.nextCalibrationDate} />
            <DetailField icon={Calendar} label="Pending Calibration" value={scanResult.pendingCalibrationDate} />
           
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={16} />
                <span className="font-semibold">Remaining Days:</span>
              </div>
              <span className={`px-2 py-1 rounded text-sm font-bold ${
                (scanResult.remainingDays || 0) <= 7 ? "bg-red-100 text-red-800" :
                (scanResult.remainingDays || 0) <= 30 ? "bg-yellow-100 text-yellow-800" :
                "bg-green-100 text-green-800"
              }`}>
                {scanResult.remainingDays || 0} days
              </span>
            </div>

            <DetailField
              icon={Users}
              label="Max Users"
              value={scanResult.maxUsersNumber?.toString()}
            />
            <DetailField icon={Clock} label="Usage Frequency" value={scanResult.usageFrequency} />
            <DetailField icon={Flame} label="Criticality" value={scanResult.criticality} />
            <DetailField icon={MapPin} label="Location" value={scanResult.location} />
           
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span className="font-semibold">Status:</span>
              <span className={`px-2 py-1 rounded text-sm font-semibold ${
                scanResult.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                scanResult.status === "ISSUED" ? "bg-blue-100 text-blue-800" :
                scanResult.status === "INACTIVE" ? "bg-gray-100 text-gray-800" :
                "bg-orange-100 text-orange-800"
              }`}>
                {scanResult.status || "UNKNOWN"}
              </span>
            </div>
          </div>
        </div>

        {scanResult.notes && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-2">
              <Info className="text-purple-600" size={18} />
              Notes
            </h4>
            <p className="text-purple-700 whitespace-pre-wrap">{scanResult.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 mt-[64px] z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-96px)] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
         
          <div className="flex items-center space-x-3">
            <Scan size={28} className="text-blue-200" />
            <div>
              <h1 className="text-2xl font-bold">Gage {codeType === 'barcode' ? 'Barcode' : 'QR Code'} Scanner</h1>
              <p className="text-blue-100">
                {scanMode === "camera" && `Camera ${codeType === 'barcode' ? 'Barcode' : 'QR Code'} Scan`}
                {scanMode === "manual" && "Serial Number Lookup"}
                {scanMode === "upload" && `Upload ${codeType === 'barcode' ? 'Barcode' : 'QR Code'} Image`}
                {scanResult && "Scan Results"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <span className="text-red-700 font-medium">Error:</span>
                <span className="text-red-600 ml-2">{error}</span>
              </div>
            </div>
          )}

          {loading && !scanResult && scanMode !== "camera" && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <span className="text-gray-600">Processing...</span>
              </div>
            </div>
          )}

          {!scanResult && !loading && (
            <>
              {renderModeButtons()}
              {scanMode === "camera" && renderCameraScan()}
              {scanMode === "manual" && renderManualEntry()}
              {scanMode === "upload" && renderUploadScreen()}
            </>
          )}

          {scanResult && renderScanResults()}
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
    <Icon size={18} className="text-gray-500" />
    <div className="flex-1">
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className="text-gray-800 font-semibold">{value || "N/A"}</div>
    </div>
  </div>
);

export default GageScanner;