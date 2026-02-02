// src/components/yourfolder/GageForm.jsx
import React, { useState, useEffect, useRef } from "react";
import InputField from "../../form/InputField";
import SearchableSelect from "../../form/SearchableSelect";
import AddItemModal from "./AddItemModal";
import ManufacturerDetails from "./ManufacturerDetails";
import Modal from "../Modal";
import GageTypeForm from "./GageTypeForm";
import InhouseCalibrationMachineForm from "./InhouseCalibrationMachineForm";
import Button from "../../ui/Button";
import api from "../../api/axios";
import { ClipboardPlus, Camera, Upload, X, ZoomIn, ZoomOut, Crop, Sun, Image, RotateCcw, Check, Minus, Plus, Video, FileText } from "lucide-react";
import GageFormImport from "./GageFormImport"; // Import the new component

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Occasionally"];
const CRITICALITIES = ["High", "Medium", "Low"];
const LOCATIONS = ["Shop Floor", "Lab", "Warehouse","HF","TH","NF","BF","LAB","TH LAB","Furnace","NF Furnace"];
const CODE_TYPES = ["Barcode Only", "QR Only", "Both"];
const FREQUENCY_MAP = {
  Daily: "DAILY",
  Weekly: "WEEKLY",
  Monthly: "MONTHLY",
  Occasionally: "OCCASIONALLY",
};
const CRITICALITY_MAP = {
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
};
const LOCATION_MAP = {
  "Shop Floor": "SHOP_FLOOR",
  Lab: "LAB",
  Warehouse: "WAREHOUSE",
};
const CODE_TYPE_MAP = {
  "Barcode Only": "BARCODE_ONLY",
  "QR Only": "QR_ONLY",
  "Both": "BOTH",
};

const GageForm = ({ onGageAdded, onClose }) => {
  const [form, setForm] = useState({
    gageType: "",
    modelNumber: "",
    gageSubType: "",
    manufacturer: "",
    serialNumber: "",
    measurementRange: "",
    accuracy: "",
    purchaseDate: "",
    calibrationInterval: "",
    nextCalibrationDate: "",
    maxUsersNumber: "",
    frequency: "",
    criticality: "",
    location: "",
    notes: "",
    codeType: "Both",
    inhouseCalibrationMachine: "",
  });
  const [gageImageFiles, setGageImageFiles] = useState([]);
  const [gageVideoFiles, setGageVideoFiles] = useState([]);
  const [gageManualFile, setGageManualFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [gageTypes, setGageTypes] = useState([]);
  const [gageSubTypes, setGageSubTypes] = useState([]);
  const [inhouseCalibrationMachines, setInhouseCalibrationMachines] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [previewManual, setPreviewManual] = useState(null);
  const [serialValid, setSerialValid] = useState(true);
  const [serialCheckLoading, setSerialCheckLoading] = useState(false);
  const [createdGage, setCreatedGage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditingImage, setCurrentEditingImage] = useState(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  // ✅ New: Video recording states
  const [showVideoCamera, setShowVideoCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(null);
  // Image editing states
  const [imageEdit, setImageEdit] = useState({
    zoom: 1,
    brightness: 100,
    contrast: 100,
    grayscale: 0,
    crop: { x: 0, y: 0, width: 100, height: 100 },
    rotation: 0,
    scale: 1
  });
  const [cropMode, setCropMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // ✅ Modal states for adding new items
  const [showAddGageSubTypeModal, setShowAddGageSubTypeModal] = useState(false);
  const [showAddManufacturerModal, setShowAddManufacturerModal] = useState(false);
  const [showAddGageTypeModal, setShowAddGageTypeModal] = useState(false);
  const [showAddInhouseMachineModal, setShowAddInhouseMachineModal] = useState(false);
  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  
  const videoRef = useRef(null);
  const videoRecorderRef = useRef(null); // ✅ New: Video recorder ref
  const mediaRecorderRef = useRef(null); // ✅ New: Media recorder ref
  const recordedChunksRef = useRef([]); // ✅ New: Recorded video chunks
  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const cropOverlayRef = useRef(null);
  
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopRecording(); // ✅ New: Stop recording on unmount
    };
  }, []);
  
  // Stop camera stream properly
  const stopCameraStream = () => {
    if (streamRef.current) {
      console.log("Stopping camera stream");
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (videoRecorderRef.current) { // ✅ New: Clean video recorder
      videoRecorderRef.current.srcObject = null;
    }
  };
  
  // Auto-stop stream when camera modal closes
  useEffect(() => {
    if (!showCamera && !showVideoCamera) {
      stopCameraStream();
      setCameraLoading(false);
      setCameraError("");
      stopRecording(); // ✅ New: Stop recording when modal closes
    }
  }, [showCamera, showVideoCamera]);
  
  // Reset image editor when opening new image
  useEffect(() => {
    if (showImageEditor && currentEditingImage) {
      setImageEdit({
        zoom: 1,
        brightness: 100,
        contrast: 100,
        grayscale: 0,
        crop: { x: 0, y: 0, width: 100, height: 100 },
        rotation: 0,
        scale: 1
      });
      setCropMode(false);
    }
  }, [showImageEditor, currentEditingImage]);
  
  // ✅ New: Effect to handle recording timer
  useEffect(() => {
    if (isRecording && recordedTime >= 20) {
      stopRecording();
    }
  }, [isRecording, recordedTime]);
  
  useEffect(() => {
    const fetchGageTypes = async () => {
      try {
        const res = await api.get("/gage-types/all");
        const uniqueNames = [...new Set(res.data.map((item) => item.name))];
        setGageTypes(uniqueNames);
      } catch (err) {
        console.error("Failed to fetch gage types", err);
      }
    };
    fetchGageTypes();
  }, []);
  
  useEffect(() => {
    const fetchManufacturers = async () => {
      try {
        const res = await api.get("/manufacturers");
        setManufacturers(res.data);
      } catch (err) {
        console.error("Failed to fetch manufacturers", err);
      }
    };
    fetchManufacturers();
  }, []);
  
  useEffect(() => {
    const fetchGageSubTypes = async () => {
      try {
        const res = await api.get("/gage-sub-types/all");
        setGageSubTypes(res.data || []);
      } catch (err) {
        console.error("Failed to fetch gage sub types", err);
      }
    };
    fetchGageSubTypes();
  }, []);
  
  useEffect(() => {
    const fetchInhouseCalibrationMachines = async () => {
      try {
        const res = await api.get("/inhouse-calibration-machines/all");
        setInhouseCalibrationMachines(res.data || []);
      } catch (err) {
        console.error("Failed to fetch inhouse calibration machines", err);
      }
    };
    fetchInhouseCalibrationMachines();
  }, []);
  
  const validateField = (name, value) => {
    if (
      [
        "gageType",
        "manufacturer",
        "modelNumber",
        "serialNumber",
        "gageSubType",
        "measurementRange",
        "accuracy",
        "purchaseDate",
        "calibrationInterval",
        "nextCalibrationDate",
        "maxUsersNumber",
        "frequency",
        "criticality",
        "location",
        "codeType",
      ].includes(name) &&
      !value.trim()
    ) {
      return "This field is required.";
    }
    if (name === "calibrationInterval" && (isNaN(value) || Number(value) <= 0)) {
      return "Enter valid number of months.";
    }
    if (name === "maxUsersNumber" && (isNaN(value) || Number(value) <= 0)) {
      return "Enter valid number of users (minimum 1).";
    }
    return "";
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    if (name === "serialNumber") checkSerialNumber(value);
  };
  
  const handleCodeTypeChange = (codeTypeValue) => {
    setForm((prev) => ({ ...prev, codeType: codeTypeValue }));
    setErrors((prev) => ({ ...prev, codeType: validateField("codeType", codeTypeValue) }));
  };
  
  // ✅ Callbacks for adding new items
  const handleAddGageSubTypeSuccess = (newSubType) => {
    setGageSubTypes((prev) => [...prev, newSubType]);
    const subTypeId = newSubType.id?.toString() || newSubType;
    setForm((prev) => ({ ...prev, gageSubType: subTypeId }));
  };
  
  const handleAddGageTypeSuccess = (newGageType) => {
    const name = newGageType?.name || newGageType;
    if (!name) return;
    setGageTypes((prev) => [...prev, name]);
    setForm((prev) => ({ ...prev, gageType: name }));
  };
  
  const handleAddInhouseMachineSuccess = (newMachine) => {
    const item = newMachine?.id ? newMachine : { ...newMachine, id: newMachine?.id || Date.now().toString(), machineName: newMachine?.machineName || newMachine?.name || "" };
    setInhouseCalibrationMachines((prev) => [...prev, item]);
    setForm((prev) => ({ ...prev, inhouseCalibrationMachine: (item.id || item).toString() }));
  };
  
  const handleAddManufacturerSuccess = (newMfg) => {
    setManufacturers((prev) => [...prev, newMfg]);
    const mfgId = newMfg.id?.toString() || newMfg;
    setForm((prev) => ({ ...prev, manufacturer: mfgId }));
  };
  
  const checkSerialNumber = async (serial) => {
    if (!serial.trim()) {
      setSerialValid(true);
      return;
    }
    try {
      setSerialCheckLoading(true);
      const res = await api.get(`/gages/validate/serial-number?serialNumber=${serial}`);
      setSerialValid(res.data);
    } catch (err) {
      console.error("Serial validation error", err);
      setSerialValid(true);
    } finally {
      setSerialCheckLoading(false);
    }
  };
  
  // 📸 Open camera for photos
  const openCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported in this browser.");
      return;
    }
    stopCameraStream();
    try {
      console.log("Attempting to access camera...");
      setCameraLoading(true);
      setCameraError("");
      setShowCamera(true);
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      console.log("Requesting camera with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Stream obtained successfully");
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current.play()
            .then(() => {
              console.log("Video playback started successfully");
              setCameraLoading(false);
            })
            .catch(playErr => {
              console.error("Play error:", playErr);
              setCameraError("Failed to start video playback");
              setCameraLoading(false);
            });
        };
        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e);
          setCameraError("Video element error occurred");
          setCameraLoading(false);
        };
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState < 2) {
            console.warn("Video not ready after timeout, forcing play");
            videoRef.current.play().catch(err => {
              console.error("Forced play error:", err);
            });
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMsg = `Camera access failed: ${err.message}`;
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
        errorMsg = "No camera found or camera doesn't support requirements. Please check your camera connection.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is already in use by another application. Please close other camera apps and try again.";
      }
      setCameraError(errorMsg);
      setCameraLoading(false);
      setShowCamera(false);
      alert(errorMsg);
    }
  };
  
  // ✅ New: Open camera for video recording
  const openVideoCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported in this browser.");
      return;
    }
    stopCameraStream();
    try {
      console.log("Attempting to access camera for video recording...");
      setCameraLoading(true);
      setCameraError("");
      setShowVideoCamera(true);
      setIsRecording(false);
      setRecordedTime(0);
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true // ✅ Enable audio for video recording
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Video stream obtained successfully");
      streamRef.current = stream;
      if (videoRecorderRef.current) {
        videoRecorderRef.current.srcObject = stream;
        videoRecorderRef.current.onloadedmetadata = () => {
          console.log("Video recorder metadata loaded");
          videoRecorderRef.current.play()
            .then(() => {
              console.log("Video recorder playback started successfully");
              setCameraLoading(false);
            })
            .catch(playErr => {
              console.error("Video recorder play error:", playErr);
              setCameraError("Failed to start video recorder playback");
              setCameraLoading(false);
            });
        };
        videoRecorderRef.current.onerror = (e) => {
          console.error("Video recorder element error:", e);
          setCameraError("Video recorder element error occurred");
          setCameraLoading(false);
        };
      }
    } catch (err) {
      console.error("Video camera access error:", err);
      let errorMsg = `Camera access failed: ${err.message}`;
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera permission denied. Please allow camera access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
        errorMsg = "No camera found or camera doesn't support requirements. Please check your camera connection.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is already in use by another application. Please close other camera apps and try again.";
      }
      setCameraError(errorMsg);
      setCameraLoading(false);
      setShowVideoCamera(false);
      alert(errorMsg);
    }
  };
  
  // ✅ New: Start video recording
  const startRecording = () => {
    if (!streamRef.current) {
      alert("Camera stream not available. Please try again.");
      return;
    }
    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `gage_video_${Date.now()}.webm`, { type: 'video/webm' });
        setGageVideoFiles(prev => [...prev, file]);
        console.log("Video recorded and saved successfully");
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordedTime(0);
      // Start timer
      const timer = setInterval(() => {
        setRecordedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= 20) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      setRecordingTimer(timer);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start video recording. Please try again.");
    }
  };
  
  // ✅ New: Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
      closeVideoCamera();
    }
  };
  
  // ✅ New: Close video camera
  const closeVideoCamera = () => {
    console.log("Closing video camera modal");
    setShowVideoCamera(false);
    setCameraLoading(false);
    setCameraError("");
    setIsRecording(false);
    setRecordedTime(0);
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };
  
  // 📷 Capture photo
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      alert("Camera feed not ready. Please wait a moment and try again.");
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `gage_${Date.now()}.jpg`, { type: "image/jpeg" });
          setCurrentEditingImage(URL.createObjectURL(blob));
          setShowImageEditor(true);
          console.log("Photo captured successfully, opening editor");
        }
      }, "image/jpeg", 0.9);
      closeCamera();
    } catch (error) {
      console.error("Error capturing photo:", error);
      alert("Failed to capture photo. Please try again.");
    }
  };
  
  const closeCamera = () => {
    console.log("Closing camera modal");
    setShowCamera(false);
    setCameraLoading(false);
    setCameraError("");
  };
  
  // 🖼️ Image Editing Functions (unchanged - keeping existing image editing code)
  const applyImageEdits = () => {
    if (!canvasRef.current || !imageRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    // Set canvas size to original image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Apply filters
    ctx.filter = `
      brightness(${imageEdit.brightness}%)
      contrast(${imageEdit.contrast}%)
      grayscale(${imageEdit.grayscale}%)
    `;
    // Calculate crop area based on percentages
    const cropX = (imageEdit.crop.x / 100) * img.naturalWidth;
    const cropY = (imageEdit.crop.y / 100) * img.naturalHeight;
    const cropWidth = (imageEdit.crop.width / 100) * img.naturalWidth;
    const cropHeight = (imageEdit.crop.height / 100) * img.naturalHeight;
    // Ensure crop area stays within image bounds
    const safeCropX = Math.max(0, Math.min(cropX, img.naturalWidth - 10));
    const safeCropY = Math.max(0, Math.min(cropY, img.naturalHeight - 10));
    const safeCropWidth = Math.max(10, Math.min(cropWidth, img.naturalWidth - safeCropX));
    const safeCropHeight = Math.max(10, Math.min(cropHeight, img.naturalHeight - safeCropY));
    // Draw cropped and transformed image
    ctx.save();
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Apply rotation
    ctx.rotate((imageEdit.rotation * Math.PI) / 180);
    // Apply scale
    ctx.scale(imageEdit.scale, imageEdit.scale);
    // Draw the cropped image
    ctx.drawImage(
      img,
      safeCropX, safeCropY, safeCropWidth, safeCropHeight, // source crop
      -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height // destination
    );
    ctx.restore();
    // Convert to blob and return
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };
  
  const saveEditedImage = async () => {
    const blob = await applyImageEdits();
    if (blob) {
      const file = new File([blob], `gage_edited_${Date.now()}.jpg`, { type: "image/jpeg" });
      setGageImageFiles(prev => [...prev, file]);
      setShowImageEditor(false);
      setCurrentEditingImage(null);
      setCropMode(false);
    }
  };
  
  const handleEditChange = (property, value) => {
    setImageEdit(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  const handleCropChange = (property, value) => {
    setImageEdit(prev => ({
      ...prev,
      crop: {
        ...prev.crop,
        [property]: Math.max(0, Math.min(100, value)) // Ensure value stays between 0-100
      }
    }));
  };
  
  // Zoom functions
  const zoomIn = () => {
    setImageEdit(prev => ({
      ...prev,
      scale: Math.min(3, prev.scale + 0.1) // Max zoom 300%
    }));
  };
  
  const zoomOut = () => {
    setImageEdit(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale - 0.1) // Min zoom 10%
    }));
  };
  
  const resetEdits = () => {
    setImageEdit({
      zoom: 1,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      crop: { x: 0, y: 0, width: 100, height: 100 },
      rotation: 0,
      scale: 1
    });
    setCropMode(false);
  };
  
  // Crop mode functions
  const startCrop = () => {
    setCropMode(true);
  };
  
  const applyCrop = () => {
    setCropMode(false);
    // The crop is already applied through the crop state
  };
  
  const cancelCrop = () => {
    setCropMode(false);
    // Reset crop to full image
    setImageEdit(prev => ({
      ...prev,
      crop: { x: 0, y: 0, width: 100, height: 100 }
    }));
  };
  
  // Handle mouse events for crop overlay
  const handleMouseDown = (e) => {
    if (!cropMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setIsDragging(true);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging || !cropMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    // Update crop position
    setImageEdit(prev => ({
      ...prev,
      crop: {
        ...prev.crop,
        x: Math.max(0, Math.min(100 - prev.crop.width, prev.crop.x + deltaX)),
        y: Math.max(0, Math.min(100 - prev.crop.height, prev.crop.y + deltaY))
      }
    }));
    setDragStart({ x: currentX, y: currentY });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // 📁 Handle image file uploads (append to existing)
  const handleImageFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setCurrentEditingImage(URL.createObjectURL(newFiles[0]));
      setShowImageEditor(true);
    }
    e.target.value = null;
  };
  
  // Handle video file uploads
  const handleVideoFilesChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setGageVideoFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = null;
  };
  
  const handleManualFileChange = (e) => {
    setGageManualFile(e.target.files[0]);
  };
  
  const removeImage = (index) => {
    setGageImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Remove video function
  const removeVideo = (index) => {
    setGageVideoFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Preview video function
  const previewVideoFile = (file) => {
    setPreviewVideo(URL.createObjectURL(file));
    setShowVideoPreview(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.entries(form).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) newErrors[name] = error;
    });
    let calibrationIntervalValue = parseInt(form.calibrationInterval, 10);
    if (isNaN(calibrationIntervalValue) || calibrationIntervalValue <= 0) {
      newErrors.calibrationInterval = "Calibration interval must be a positive number";
    }
    let maxUsersNumberValue = parseInt(form.maxUsersNumber, 10);
    if (isNaN(maxUsersNumberValue) || maxUsersNumberValue <= 0) {
      newErrors.maxUsersNumber = "Max users number must be a positive number";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    if (!serialValid) {
      alert("❌ Cannot submit: Serial number already exists!");
      return;
    }
    let pendingCalibrationDate = form.nextCalibrationDate;
    if (form.criticality === "Medium") {
      const date = new Date(form.nextCalibrationDate);
      date.setDate(date.getDate() + 10);
      pendingCalibrationDate = date.toISOString().split("T")[0];
    } else if (form.criticality === "Low") {
      const date = new Date(form.nextCalibrationDate);
      date.setDate(date.getDate() + 15);
      pendingCalibrationDate = date.toISOString().split("T")[0];
    }
    const formData = new FormData();
    formData.append("gageTypeName", form.gageType);
    formData.append("manufacturerId", form.manufacturer);
    formData.append("modelNumber", form.modelNumber);
    formData.append("serialNumber", form.modelNumber);
    formData.append("gageSubTypeId", form.gageSubType);
    if (form.inhouseCalibrationMachine) {
      formData.append("inhouseCalibrationMachineId", form.inhouseCalibrationMachine);
    }
    formData.append("measurementRange", form.measurementRange);
    formData.append("accuracy", form.accuracy);
    formData.append("purchaseDate", form.purchaseDate);
    formData.append("calibrationInterval", calibrationIntervalValue.toString());
    formData.append("nextCalibrationDate", form.nextCalibrationDate);
    formData.append("pendingCalibrationDate", pendingCalibrationDate);
    formData.append("maxUsersNumber", maxUsersNumberValue.toString());
    formData.append("usageFrequency", FREQUENCY_MAP[form.frequency]);
    formData.append("criticality", CRITICALITY_MAP[form.criticality]);
    formData.append("location", LOCATION_MAP[form.location]);
    formData.append("notes", form.notes);
    formData.append("codeType", CODE_TYPE_MAP[form.codeType]);
    // Append images
    gageImageFiles.forEach((file) => {
      formData.append("gageImages", file);
    });
    // Append videos
    gageVideoFiles.forEach((file) => {
      formData.append("gageVideos", file);
    });
    if (gageManualFile) formData.append("gageManual", gageManualFile);
    try {
      const res = await api.post("/gages/upload", formData);
      setCreatedGage(res.data);
      setShowSuccessModal(true);
      if (onGageAdded) onGageAdded();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save gage.");
    }
  };
  
  // Handle import completion
  const handleImportComplete = (results) => {
    console.log("Import completed:", results);
    // You can add additional logic here after import completion
    if (onGageAdded) {
      onGageAdded();
    }
  };
  
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-50">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative bg-[#005797] text-white px-6 py-4 rounded-t-2xl flex justify-center items-center">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="w-6 h-6" />
            <h2 className="text-lg md:text-xl font-semibold">Add Gage Details</h2>
          </div>
          {/* Add Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="ml-4 px-3 py-1 bg-white text-[#005797] rounded text-sm hover:bg-gray-100"
          >
            <FileText size={16} className="inline mr-1" />
            Import Bulk Gages
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-6 text-white text-2xl font-bold hover:text-gray-200"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identification */}
            <div className="rounded-xl border shadow-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchableSelect
                  label="Gage Type"
                  name="gageType"
                  value={form.gageType}
                  onChange={handleChange}
                  error={errors.gageType}
                  options={gageTypes}
                  showAddButton={true}
                  onAddNew={() => setShowAddGageTypeModal(true)}
                />
                <SearchableSelect
                  label="Gage Sub-Type"
                  name="gageSubType"
                  value={form.gageSubType}
                  onChange={handleChange}
                  error={errors.gageSubType}
                  options={gageSubTypes.map((gst) => ({ label: gst.name, value: gst.id.toString() }))}
                  showAddButton={true}
                  onAddNew={() => setShowAddGageSubTypeModal(true)}
                />
                {/* Inhouse Calibration Machine dropdown temporarily commented out
                <SearchableSelect
                  label="Inhouse Calibration Machine (Optional)"
                  name="inhouseCalibrationMachine"
                  value={form.inhouseCalibrationMachine}
                  onChange={handleChange}
                  error={errors.inhouseCalibrationMachine}
                  options={[{ label: "None", value: "" }, ...inhouseCalibrationMachines.map((m) => ({ label: m.machineName, value: m.id.toString() }))]}
                  showAddButton={true}
                  onAddNew={() => setShowAddInhouseMachineModal(true)}
                /> */}
                <SearchableSelect
                  label="OEM (Manufacturer)"
                  name="manufacturer"
                  value={form.manufacturer}
                  onChange={handleChange}
                  error={errors.manufacturer}
                  options={manufacturers.map((m) => ({ label: m.name, value: m.id.toString() }))}
                  showAddButton={true}
                  onAddNew={() => setShowAddManufacturerModal(true)}
                />
                <InputField
                  label="Model Number"
                  name="modelNumber"
                  value={form.modelNumber}
                  onChange={handleChange}
                  error={errors.modelNumber}
                />
                <div className="flex flex-col">
                  <InputField
                    label="Serial Number"
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleChange}
                    error={errors.serialNumber}
                  />
                  {!serialValid && (
                    <span className="text-red-500 text-sm mt-1">
                      ❌ This serial number already exists!
                    </span>
                  )}
                  {serialCheckLoading && <span className="text-gray-500 text-sm mt-1">Checking...</span>}
                </div>
                <div className="flex flex-col">
                  <label className="block font-semibold mb-2">Code Type</label>
                  {errors.codeType && (
                    <span className="text-red-500 text-sm mb-1">{errors.codeType}</span>
                  )}
                  <div className="flex space-x-3">
                    {CODE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleCodeTypeChange(type)}
                        className={`
                          px-4 py-2 rounded-lg border
                          transition-all duration-200
                          ${form.codeType === type
                            ? "bg-[#005797] text-white border-[#005797]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Media Upload Section */}
            <div className="rounded-xl border shadow-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Media Upload</h3>
              {/* Images Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Gage Images ({gageImageFiles.length} selected)
                </h4>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                  >
                    <Camera size={14} />
                    Take Photo
                  </button>
                  <label
                    htmlFor="gage-images-input"
                    className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded cursor-pointer"
                  >
                    <Upload size={14} />
                    Upload Images
                  </label>
                  <input
                    id="gage-images-input"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleImageFilesChange}
                    className="hidden"
                  />
                </div>
                {/* Image Preview */}
                <div className="flex flex-wrap gap-2">
                  {gageImageFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* New: Videos Section */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-md font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Gage Videos ({gageVideoFiles.length} selected) - Optional
                </h4>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={openVideoCamera}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                  >
                    <Camera size={14} />
                    Record Video (Max 20s)
                  </button>
                  <label
                    htmlFor="gage-videos-input"
                    className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded cursor-pointer"
                  >
                    <Upload size={14} />
                    Upload Videos
                  </label>
                  <input
                    id="gage-videos-input"
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/*"
                    multiple
                    onChange={handleVideoFilesChange}
                    className="hidden"
                  />
                </div>
                {/* Video Preview */}
                <div className="flex flex-wrap gap-2">
                  {gageVideoFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-300"
                        onClick={() => previewVideoFile(file)}
                      >
                        <Video className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="text-xs text-gray-600 mt-1 truncate w-16">
                        {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Calibration */}
            <div className="rounded-xl border shadow-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Calibration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Measurement Range"
                  name="measurementRange"
                  value={form.measurementRange}
                  onChange={handleChange}
                  error={errors.measurementRange}
                />
                <InputField
                  label="Accuracy / Resolution"
                  name="accuracy"
                  value={form.accuracy}
                  onChange={handleChange}
                  error={errors.accuracy}
                />
                <InputField
                  type="date"
                  label="Purchase Date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                  error={errors.purchaseDate}
                />
                <InputField
                  type="number"
                  label="Calibration Interval (months)"
                  name="calibrationInterval"
                  value={form.calibrationInterval}
                  onChange={handleChange}
                  error={errors.calibrationInterval}
                />
                <InputField
                  type="date"
                  label="Next Calibration Date"
                  name="nextCalibrationDate"
                  value={form.nextCalibrationDate}
                  onChange={handleChange}
                  error={errors.nextCalibrationDate}
                />
                <InputField
                  type="number"
                  label="Max Usage Number"
                  name="maxUsersNumber"
                  value={form.maxUsersNumber}
                  onChange={handleChange}
                  error={errors.maxUsersNumber}
                  placeholder="Maximum number of usages allowed"
                />
                <InputField
                  type="select"
                  label="Usage Frequency"
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  error={errors.frequency}
                  options={FREQUENCIES}
                />
                <InputField
                  type="select"
                  label="Criticality"
                  name="criticality"
                  value={form.criticality}
                  onChange={handleChange}
                  error={errors.criticality}
                  options={CRITICALITIES}
                />
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  📅 Pending Calibration Date Calculation
                </h4>
                <p className="text-sm text-blue-700">
                  The pending calibration date will be automatically calculated based on the criticality level:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• <strong>High Criticality:</strong> Same as next calibration date</li>
                  <li>• <strong>Medium Criticality:</strong> +10 days</li>
                  <li>• <strong>Low Criticality:</strong> +15 days</li>
                </ul>
              </div>
            </div>
            
            {/* Location & Files */}
            <div className="rounded-xl border shadow-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Location & Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  type="select"
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  error={errors.location}
                  options={LOCATIONS}
                />
                <div>
                  <label className="block font-semibold mb-2">Gage Manual</label>
                  <input
                    id="gage-manual-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleManualFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="gage-manual-input"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 text-sm"
                  >
                    📎 Upload
                  </label>
                  {gageManualFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {gageManualFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="rounded-xl border shadow-sm p-6 bg-white">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Notes</h3>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-[#005797] focus:outline-none"
                placeholder="Additional information about this gage..."
              />
            </div>
            
            {/* Buttons */}
            <div className="pt-4 flex justify-between">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Gage
              </Button>
            </div>
          </form>
          
          {/* Success Modal */}
          {showSuccessModal && createdGage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Gage Created Successfully!</h3>
                  <p className="text-gray-600 mb-4">
                    The gage has been registered and its code(s) have been generated.
                  </p>
                  <div className="space-y-4 mb-4">
                    {createdGage.barcodeImage && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Barcode:</p>
                        <img
                          src={`data:image/png;base64,${createdGage.barcodeImage}`}
                          alt="Gage Barcode"
                          className="w-full max-w-[200px] mx-auto border border-gray-300 rounded px-2 py-3 bg-white"
                        />
                      </div>
                    )}
                    {createdGage.qrCodeImage && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">QR Code:</p>
                        <img
                          src={`data:image/png;base64,${createdGage.qrCodeImage}`}
                          alt="Gage QR Code"
                          className="w-full max-w-[200px] mx-auto border border-gray-300 rounded px-2 py-3 bg-white"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-900 mt-2 font-mono">
                      Serial Number: {createdGage.serialNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (onGageAdded) onGageAdded();
                      if (onClose) onClose();
                    }}
                    className="px-5 py-2 bg-[#005797] text-white text-lg font-medium rounded-md hover:bg-[#004a7e]"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Photo Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 max-w-md w-full text-center">
                <h3 className="text-lg font-bold mb-4">📸 Take a Photo</h3>
                {cameraLoading && (
                  <div className="bg-black rounded w-full h-64 flex items-center justify-center">
                    <p className="text-white">Loading camera...</p>
                  </div>
                )}
                {cameraError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {cameraError}
                  </div>
                )}
                <div className="relative w-full max-h-[60vh] mx-auto bg-black rounded overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-black min-h-[300px]"
                  />
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <p className="text-white">Please grant camera permission and wait...</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={cameraLoading || cameraError || !videoRef.current || videoRef.current.videoWidth === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Capture Photo
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* ✅ New: Video Camera Modal */}
          {showVideoCamera && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 max-w-md w-full text-center">
                <h3 className="text-lg font-bold mb-4">🎥 Record Video (Max 20 seconds)</h3>
                {cameraLoading && (
                  <div className="bg-black rounded w-full h-64 flex items-center justify-center">
                    <p className="text-white">Loading camera...</p>
                  </div>
                )}
                {cameraError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {cameraError}
                  </div>
                )}
                <div className="relative w-full max-h-[60vh] mx-auto bg-black rounded overflow-hidden">
                  <video
                    ref={videoRecorderRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-black min-h-[300px]"
                  />
                  {cameraLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <p className="text-white">Please grant camera permission and wait...</p>
                    </div>
                  )}
                  {/* Recording Timer */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ⏺️ Recording: {recordedTime}s / 20s
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeVideoCamera}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={cameraLoading || cameraError}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Stop Recording
                    </button>
                  )}
                </div>
                {/* Recording Instructions */}
                <div className="mt-3 text-sm text-gray-600">
                  {!isRecording ?
                    "Click 'Start Recording' to begin capturing video (max 20 seconds)" :
                    "Recording in progress... Click 'Stop Recording' when finished or wait for auto-stop at 20 seconds"
                  }
                </div>
              </div>
            </div>
          )}
          
          {/* Video Preview Modal */}
          {showVideoPreview && previewVideo && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-4 max-w-4xl w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Video Preview</h3>
                  <button
                    onClick={() => {
                      setShowVideoPreview(false);
                      setPreviewVideo(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    src={previewVideo}
                    controls
                    className="w-full h-auto max-h-[70vh]"
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowVideoPreview(false);
                      setPreviewVideo(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Image Editor Modal */}
          {showImageEditor && currentEditingImage && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Image className="w-6 h-6" />
                  Edit Image
                </h3>
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Image Preview - Larger area */}
                  <div className="xl:col-span-3">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="relative overflow-hidden rounded bg-black flex justify-center items-center min-h-[500px]">
                        <div
                          ref={cropOverlayRef}
                          className="relative w-full h-full flex justify-center items-center cursor-move"
                          onMouseDown={cropMode ? handleMouseDown : undefined}
                          onMouseMove={cropMode ? handleMouseMove : undefined}
                          onMouseUp={cropMode ? handleMouseUp : undefined}
                          onMouseLeave={cropMode ? handleMouseUp : undefined}
                        >
                          <img
                            ref={imageRef}
                            src={currentEditingImage}
                            alt="Editing preview"
                            className="max-w-full max-h-[500px] object-contain transition-all duration-200"
                            style={{
                              filter: `brightness(${imageEdit.brightness}%) contrast(${imageEdit.contrast}%) grayscale(${imageEdit.grayscale}%)`,
                              transform: `scale(${imageEdit.scale}) rotate(${imageEdit.rotation}deg)`,
                              cursor: cropMode ? 'move' : 'default'
                            }}
                            onLoad={() => console.log("Image loaded for editing")}
                          />
                          {/* Crop Overlay */}
                          {cropMode && (
                            <div
                              className="absolute border-2 border-yellow-400 bg-yellow-400 bg-opacity-20 pointer-events-none"
                              style={{
                                left: `${imageEdit.crop.x}%`,
                                top: `${imageEdit.crop.y}%`,
                                width: `${imageEdit.crop.width}%`,
                                height: `${imageEdit.crop.height}%`,
                              }}
                            >
                              <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                      {/* Zoom Controls */}
                      <div className="flex justify-center items-center gap-4 mt-4">
                        <button
                          type="button"
                          onClick={zoomOut}
                          disabled={imageEdit.scale <= 0.1}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ZoomOut className="w-4 h-4" />
                          Zoom Out
                        </button>
                        <span className="text-sm font-medium">
                          Zoom: {Math.round(imageEdit.scale * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={zoomIn}
                          disabled={imageEdit.scale >= 3}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ZoomIn className="w-4 h-4" />
                          Zoom In
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Editing Controls */}
                  <div className="space-y-6">
                    {/* Crop Controls */}
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Crop className="w-4 h-4" />
                        Crop Tool
                      </h4>
                      {!cropMode ? (
                        <button
                          type="button"
                          onClick={startCrop}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Start Crop
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-blue-700 mb-2">
                            Drag the crop box or use sliders below
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={applyCrop}
                              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              onClick={cancelCrop}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Crop Settings */}
                    {cropMode && (
                      <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-sm text-yellow-800">Crop Settings</h4>
                        <div>
                          <label className="text-xs font-medium mb-1 block">X: {Math.round(imageEdit.crop.x)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            value={imageEdit.crop.x}
                            onChange={(e) => handleCropChange('x', parseInt(e.target.value))}
                            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Y: {Math.round(imageEdit.crop.y)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="95"
                            value={imageEdit.crop.y}
                            onChange={(e) => handleCropChange('y', parseInt(e.target.value))}
                            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Width: {Math.round(imageEdit.crop.width)}%</label>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={imageEdit.crop.width}
                            onChange={(e) => handleCropChange('width', parseInt(e.target.value))}
                            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Height: {Math.round(imageEdit.crop.height)}%</label>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={imageEdit.crop.height}
                            onChange={(e) => handleCropChange('height', parseInt(e.target.value))}
                            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                    {/* Brightness */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Sun className="w-4 h-4" />
                        Brightness: {imageEdit.brightness}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={imageEdit.brightness}
                        onChange={(e) => handleEditChange('brightness', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    {/* Contrast */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Image className="w-4 h-4" />
                        Contrast: {imageEdit.contrast}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={imageEdit.contrast}
                        onChange={(e) => handleEditChange('contrast', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    {/* Grayscale */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Image className="w-4 h-4" />
                        Black & White: {imageEdit.grayscale}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={imageEdit.grayscale}
                        onChange={(e) => handleEditChange('grayscale', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    {/* Rotation */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Crop className="w-4 h-4" />
                        Rotation: {imageEdit.rotation}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={imageEdit.rotation}
                        onChange={(e) => handleEditChange('rotation', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetEdits}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowImageEditor(false);
                          setCurrentEditingImage(null);
                          setCropMode(false);
                        }}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEditedImage}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Save Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Manual Preview Modal */}
          {previewManual && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="w-full max-w-3xl max-h-[90vh] bg-white p-4 rounded overflow-auto relative">
                <iframe src={previewManual} title="Manual Preview" className="w-full h-[80vh]" />
                <button
                  className="absolute top-2 right-2 text-black text-2xl font-bold"
                  onClick={() => setPreviewManual(null)}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* ✅ Add Gage Sub-Type Modal */}
          <AddItemModal
            isOpen={showAddGageSubTypeModal}
            title="Add New Gage Sub-Type"
            itemType="Gage Sub-Type"
            endpoint="/gage-sub-types/add"
            onClose={() => setShowAddGageSubTypeModal(false)}
            onSuccess={handleAddGageSubTypeSuccess}
            fields={[
              { name: "name", label: "Sub-Type Name", type: "text", required: true, placeholder: "e.g., Digital" }
            ]}
          />
          
          {/* ✅ Add Manufacturer Modal */}
          <ManufacturerDetails
            isOpen={showAddManufacturerModal}
            onClose={() => setShowAddManufacturerModal(false)}
            onSave={handleAddManufacturerSuccess}
          />
          
          {/* ✅ Add Gage Type Modal (uses full GageTypeForm) */}
          {showAddGageTypeModal && (
            <Modal title="Add Gage Type" onClose={() => setShowAddGageTypeModal(false)}>
              <GageTypeForm onClose={() => setShowAddGageTypeModal(false)} onSave={handleAddGageTypeSuccess} />
            </Modal>
          )}
          
          {/* ✅ Add Inhouse Calibration Machine Modal */}
          {showAddInhouseMachineModal && (
            <Modal title="Add Inhouse Calibration Machine" onClose={() => setShowAddInhouseMachineModal(false)}>
              <InhouseCalibrationMachineForm onClose={() => setShowAddInhouseMachineModal(false)} onSave={handleAddInhouseMachineSuccess} />
            </Modal>
          )}
          
          {/* Import Modal */}
          {showImportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Import Bulk Gages</h3>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <GageFormImport onImportComplete={handleImportComplete} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GageForm;