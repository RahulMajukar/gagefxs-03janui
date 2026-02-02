import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "../Modal";
import axios from "../../api/axios";
import { useParams } from "react-router-dom";
import {
  Edit3,
  Tag,
  Hash,
  Package,
  Factory,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Video,
  Play,
  Image as ImageIcon,
  Download,
  Plus,
  Trash2,
} from "lucide-react";

// Helpers
const byteArrayToBase64 = (byteArray) => {
  if (!byteArray) return null;
  const bytes = new Uint8Array(byteArray);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
  });

// Helper to extract base64 from data URL
const extractBase64FromDataUrl = (dataUrl) => {
  if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
};

// Helper to create image URL for display
const createImageUrl = (imageData) => {
  if (!imageData) return null;

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    return imageData;
  } else {
    const base64 = Array.isArray(imageData) ? byteArrayToBase64(imageData) : imageData;
    return `data:image/jpeg;base64,${base64}`;
  }
};

// Badge colors for status
const statusConfig = {
  ACTIVE: { color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-4 h-4" /> },
  INACTIVE: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  CALIBRATION_DUE: { color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle className="w-4 h-4" /> },
};

// Media Carousel Component
const MediaCarousel = ({ images = [], videos = [], onImageClick, onVideoPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allMedia = [
    ...images.map(img => ({ type: 'image', data: img })),
    ...videos.map(vid => ({ type: 'video', data: vid }))
  ];

  const nextMedia = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === allMedia.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevMedia = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? allMedia.length - 1 : prevIndex - 1
    );
  };

  if (allMedia.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl border">
        No Media Available
      </div>
    );
  }

  const currentMedia = allMedia[currentIndex];
  const imageUrl = currentMedia.type === 'image' ? createImageUrl(currentMedia.data) : null;

  return (
    <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden group">
      {/* Main Media Display */}
      {currentMedia.type === 'image' ? (
        <img
          src={imageUrl}
          alt={`Gage image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={() => onImageClick(imageUrl)}
          onError={(e) => {
            console.error("Failed to load image:", currentMedia.data);
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div
          className="w-full h-full bg-gray-800 flex items-center justify-center cursor-pointer relative"
          onClick={() => onVideoPlay(currentMedia.data)}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-black bg-opacity-60 rounded-full p-3">
              <Play className="text-white" size={20} fill="white" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {allMedia.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevMedia();
            }}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextMedia();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Media Counter */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
        {currentIndex + 1} / {allMedia.length}
      </div>

      {/* Media Type Badge */}
      <div className="absolute top-2 right-2">
        {currentMedia.type === 'image' ? (
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <ImageIcon size={12} />
            Image
          </div>
        ) : (
          <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Video size={12} />
            Video
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {allMedia.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {allMedia.map((media, index) => (
            <button
              type="button"
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${index === currentIndex
                ? (media.type === 'image' ? 'bg-white' : 'bg-purple-400')
                : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Video Player Modal
const VideoPlayerModal = ({ videoBase64, onClose }) => {
  const videoUrl = `data:video/webm;base64,${videoBase64}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg overflow-hidden relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-4 bg-gray-800">
          <video
            src={videoUrl}
            controls
            autoPlay
            muted // Respect user preference: muted by default
            className="w-full h-auto max-h-[70vh] rounded"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Gage Video</h3>
            <a
              href={videoUrl}
              download="gage_video.webm"
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Download Video
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Select = ({ label, name, options, register, required, errors, watch }) => {
  const selectedValue = watch(name) || "";
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={selectedValue}
        {...register(name, required && { required: `${label} is required` })}
        className="w-full border rounded-lg px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none border-gray-300 transition"
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>}
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg bg-white shadow-sm border">
    {icon}
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "-"}</span>
    </div>
  </div>
);

const Input = ({ label, name, type = "text", register, required, errors, watch }) => {
  const value = watch(name) || "";
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        defaultValue={value}
        {...register(name, required && { required: `${label} is required` })}
        className="w-full border rounded-lg px-3 py-2 text-sm shadow-sm border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      />
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
      )}
    </div>
  );
};

const EditGage = ({ gage = {}, onCancel, onUpdated }) => {
  const { id: idFromParams } = useParams();
  const gageId = idFromParams || gage.id;

  const [showHistory, setShowHistory] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Certificate state & handlers — MOVED OUTSIDE useEffect
  const [certificateFile, setCertificateFile] = useState(null);

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a PDF or image file (JPEG/PNG).");
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        setCertificateFile(base64);
      } catch (err) {
        console.error("Error converting certificate to base64:", err);
        alert("Error uploading certificate");
      }
    }
    e.target.value = '';
  };

  const removeCertificate = () => {
    setCertificateFile(null);
  };

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [gageTypes, setGageTypes] = useState([]);
  const [gageTypeMap, setGageTypeMap] = useState({});
  const [gageSubTypes, setGageSubTypes] = useState([]);
  const [gageSubTypeMap, setGageSubTypeMap] = useState({});
  const [inhouseCalibrationMachines, setInhouseCalibrationMachines] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);

  useEffect(() => {
    const fetchGageTypes = async () => {
      try {
        const res = await axios.get("/gage-types/all");
        const uniqueNames = [...new Set(res.data.map(item => item.name))];
        const options = uniqueNames.map(name => ({ value: name, label: name }));
        setGageTypes(options);
        const map = {};
        res.data.forEach(item => { map[item.name] = item.id; });
        setGageTypeMap(map);
      } catch (err) {
        console.error("Failed to fetch gage types", err);
        setGageTypes([{ value: "Other", label: "Other" }]);
      }
    };

    const fetchGageSubTypes = async () => {
      try {
        const res = await axios.get("/gage-sub-types/all");
        setGageSubTypes(res.data || []);
        const map = {};
        res.data.forEach(item => {
          map[item.id] = item.name;
          map[item.name] = item.id;
        });
        setGageSubTypeMap(map);
      } catch (err) {
        console.error("Failed to fetch gage sub types", err);
      }
    };

    const fetchInhouseCalibrationMachines = async () => {
      try {
        const res = await axios.get("/inhouse-calibration-machines/all");
        setInhouseCalibrationMachines(res.data || []);
      } catch (err) {
        console.error("Failed to fetch inhouse calibration machines", err);
      }
    };

    const fetchManufacturers = async () => {
      try {
        const res = await axios.get("/manufacturers");
        setManufacturers(res.data);
      } catch (err) {
        console.error("Failed to fetch manufacturers", err);
      }
    };

    fetchGageTypes();
    fetchGageSubTypes();
    fetchInhouseCalibrationMachines();
    fetchManufacturers();
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  useEffect(() => {
    const fetchGage = async () => {
      try {
        const res = await axios.get(`/gages/${gageId}`);
        const gageData = res.data;

        // Resolve names
        const gageTypeName = gageData.gageType?.name || gageData.gageTypeName || "";
        const gageSubTypeName = gageData.gageSubType?.name || "";
        const gageSubTypeId = gageData.gageSubType?.id || gageData.gageSubTypeId || "";

        reset({
          ...gageData,
          gageTypeName: gageTypeName,
          gageSubTypeId: gageSubTypeId,
          gageSubTypeName: gageSubTypeName,
          manufacturerId: gageData.manufacturer?.id || gageData.manufacturerId || "",
          manufacturerName: gageData.manufacturer?.name || gageData.manufacturerName || "",
          inhouseCalibrationMachineId: gageData.inhouseCalibrationMachine?.id || gageData.inhouseCalibrationMachineId || "",
          usageFrequency: gageData.usageFrequency || "",
          criticality: gageData.criticality || "",
          location: gageData.location || "",
          maxUsersNumber: gageData.maxUsersNumber || "",
          nextCalibrationDate: gageData.nextCalibrationDate || "",
          measurementRange: gageData.measurementRange || "12",
          accuracy: gageData.accuracy || "",
          calibrationInterval: gageData.calibrationInterval || "",
          purchaseDate: gageData.purchaseDate || "",
          notes: gageData.notes || "",
        });

        // Load media
        setImages(Array.isArray(gageData.gageImages) ? gageData.gageImages : []);
        setVideos(Array.isArray(gageData.gageVideos) ? gageData.gageVideos : []);

        // Load certificate if exists
        if (gageData.certificate) {
          const certBase64 = typeof gageData.certificate === 'string'
            ? gageData.certificate
            : byteArrayToBase64(gageData.certificate);
          setCertificateFile(certBase64);
        }
      } catch (err) {
        console.error("Error fetching gage:", err);
      }
    };
    if (gageId) fetchGage();
  }, [gageId, reset]);

  const onSubmit = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        gageType: {
          id: gageTypeMap[data.gageTypeName],
          name: data.gageTypeName,
        },
        gageSubTypeId: data.gageSubTypeId,
        manufacturerId: data.manufacturerId,
        inhouseCalibrationMachineId: data.inhouseCalibrationMachineId || null,
        usageFrequency: data.usageFrequency,
        criticality: data.criticality,
        location: data.location,
        maxUsersNumber: data.maxUsersNumber,
        measurementRange: data.measurementRange,
        accuracy: data.accuracy,
        calibrationInterval: data.calibrationInterval,
        purchaseDate: data.purchaseDate,
        nextCalibrationDate: data.nextCalibrationDate,
        notes: data.notes,
        gageImages: images.map(img => extractBase64FromDataUrl(img)),
        gageVideos: videos.map(vid => extractBase64FromDataUrl(vid)),
        certificate: certificateFile ? extractBase64FromDataUrl(certificateFile) : null, // ✅ Include certificate
      };

      const response = await axios.put(`/gages/${gageId}`, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      });

      alert("Gage updated successfully!");
      if (onUpdated) onUpdated(response.data);
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      alert("Failed to update gage: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        setImages(prev => [...prev, base64]);
      } catch (err) {
        console.error("Error uploading image:", err);
        alert("Error uploading image");
      }
    } else {
      alert("Please select an image file");
    }
    e.target.value = '';
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      try {
        const base64 = await fileToBase64(file);
        setVideos(prev => [...prev, base64]);
      } catch (err) {
        console.error("Error uploading video:", err);
        alert("Error uploading video");
      }
    } else {
      alert("Please select a video file");
    }
    e.target.value = '';
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));
  const removeVideo = (index) => setVideos(prev => prev.filter((_, i) => i !== index));

  const statusValue = watch("status");
  const statusInfo = statusConfig[statusValue] || { color: "bg-gray-100 text-gray-600", icon: <AlertCircle className="w-4 h-4" /> };
  const gageTypeName = watch("gageTypeName");
  const gageSubTypeName = watch("gageSubTypeName");
  const manufacturerName = watch("manufacturerName");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#005797] text-white p-6 flex items-center rounded-t-xl relative">
          <div className="flex items-center gap-3">
            <Edit3 className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold">Manage Gage</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-white text-2xl hover:text-gray-200 absolute right-4 top-1/2 transform -translate-y-1/2"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image & Read-only Info - Compact Layout */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Media Card - Left Side */}
            <div className="w-full md:w-2/5 p-4 rounded-xl bg-gray-50 shadow border">
              <label className="text-sm font-medium text-gray-700 mb-3 block">Gage Media</label>

              <MediaCarousel
                images={images}
                videos={videos}
                onImageClick={setPreviewImageUrl}
                onVideoPlay={setPreviewVideo}
              />

              {/* Media Management */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input type="file" accept="image/*" id="imageUpload" className="hidden" onChange={handleImageUpload} />
                  <input type="file" accept="video/*" id="videoUpload" className="hidden" onChange={handleVideoUpload} />

                  <button type="button" onClick={() => document.getElementById("imageUpload").click()} className="flex-1 px-3 py-2 rounded-lg bg-blue-200 text-black text-xs font-medium hover:bg-blue-50 shadow transition flex items-center justify-center gap-1">
                    <Plus size={14} /> Add Image
                  </button>
                  <button type="button" onClick={() => document.getElementById("videoUpload").click()} className="flex-1 px-3 py-2 rounded-lg bg-purple-200 text-black text-xs font-medium hover:bg-purple-70 shadow transition flex items-center justify-center gap-1">
                    <Plus size={14} /> Add Video
                  </button>
                </div>

                {/* Media List */}
                {(images.length > 0 || videos.length > 0) && (
                  <div className="max-h-20 overflow-y-auto space-y-1">
                    {images.map((img, index) => (
                      <div key={`img-${index}`} className="flex items-center justify-between bg-white p-1.5 rounded border text-xs">
                        <span className="text-gray-600 truncate flex items-center gap-1">
                          <ImageIcon size={12} /> Image {index + 1}
                        </span>
                        <button type="button" onClick={() => removeImage(index)} className="text-red-500 hover:text-red-700 p-1" title="Remove image">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {videos.map((vid, index) => (
                      <div key={`vid-${index}`} className="flex items-center justify-between bg-white p-1.5 rounded border text-xs">
                        <span className="text-gray-600 truncate flex items-center gap-1">
                          <Video size={12} /> Video {index + 1}
                        </span>
                        <button type="button" onClick={() => removeVideo(index)} className="text-red-500 hover:text-red-700 p-1" title="Remove video">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ✅ Certificate Upload Section */}
                {/* <div className="mt-4 pt-2 border-t">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Calibration Certificate</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    id="certificateUpload"
                    className="hidden"
                    onChange={handleCertificateUpload}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("certificateUpload").click()}
                    className="px-3 py-2 rounded-lg bg-green-200 text-black text-xs font-medium hover:bg-green-700 shadow transition flex items-center gap-1 w-full"
                  >
                    <Plus size={14} />
                    {certificateFile ? "Replace Certificate" : "Upload Certificate"}
                  </button>

                  {certificateFile && (
                    <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border text-xs">
                      <span className="text-gray-600 truncate flex items-center gap-1">
                        📄 Certificate Uploaded
                      </span>
                      <div className="flex gap-1">
                        <a
                          href={certificateFile}
                          download="calibration_certificate.pdf"
                          className="text-blue-600 hover:text-blue-800"
                          title="Download"
                        >
                          <Download size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={removeCertificate}
                          className="text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div> */}
              </div>
            </div>

            {/* Read-only Info Card - Right Side */}
            <div className="w-full md:w-3/5 p-4 rounded-xl bg-gray-50 shadow border">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Gage Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoItem icon={<Hash className="w-4 h-4 text-purple-500" />} label="Serial Number" value={watch("serialNumber")} />
                <InfoItem icon={<Package className="w-4 h-4 text-indigo-500" />} label="Model Number" value={watch("modelNumber")} />
                <InfoItem icon={<Factory className="w-4 h-4 text-green-500" />} label="Manufacturer" value={manufacturerName || "-"} />
                <InfoItem icon={<Calendar className="w-4 h-4 text-orange-500" />} label="Purchase Date" value={watch("purchaseDate")} />
                <InfoItem icon={<Tag className="w-4 h-4 text-blue-500" />} label="Gage Type" value={gageTypeName || "-"} />
                <InfoItem icon={<Tag className="w-4 h-4 text-purple-500" />} label="Gage Sub-Type" value={gageSubTypeName || "-"} />
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white shadow-sm border col-span-1 md:col-span-2">
                  {statusInfo.icon}
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Status</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                      {statusValue || "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {/* Gage Details */}
            <div className="p-4 rounded-xl bg-gray-50 shadow border grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Gage Type" name="gageTypeName" options={gageTypes} register={register} errors={errors} watch={watch} required />
              <Select
                label="Gage Sub-Type"
                name="gageSubTypeId"
                options={[{ label: "Select Gage Sub-Type", value: "" }, ...gageSubTypes.map(gst => ({ label: gst.name, value: gst.id.toString() }))]}
                register={register} errors={errors} watch={watch}
              />
              <Select
                label="Manufacturer"
                name="manufacturerId"
                options={[{ label: "Select Manufacturer", value: "" }, ...manufacturers.map(m => ({ label: m.name, value: m.id.toString() }))]}
                register={register} errors={errors} watch={watch} required
              />
              <Select
                label="Inhouse Calibration Machine (Optional)"
                name="inhouseCalibrationMachineId"
                options={[{ label: "None", value: "" }, ...inhouseCalibrationMachines.map(m => ({ label: m.machineName, value: m.id.toString() }))]}
                register={register} errors={errors} watch={watch}
              />
            </div>

            {/* Usage & Criticality */}
            <div className="p-4 rounded-xl bg-gray-50 shadow border grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Usage Frequency" name="usageFrequency" options={[
                { value: "DAILY", label: "Daily" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "OCCASIONALLY", label: "Occasionally" },
              ]} register={register} errors={errors} watch={watch} required />
              <Select label="Criticality" name="criticality" options={[
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
              ]} register={register} errors={errors} watch={watch} required />
            </div>

            <div className="p-4 rounded-xl bg-gray-50 shadow border">
              <Select
                label="Location"
                name="location"
                options={[
                  // General
                  { value: "SHOP_FLOOR", label: "Shop Floor" },
                  { value: "WAREHOUSE", label: "Warehouse" },
                  { value: "OFFICE", label: "Office" },
                  { value: "FIELD", label: "Field" },

                  // Main Areas
                  { value: "FURNACE", label: "Furnace" },
                  { value: "LAB", label: "Lab" },

                  // Furnace Types / Zones
                  { value: "TH", label: "TH Furnace" },
                  { value: "HF", label: "HF Furnace" },
                  { value: "NF", label: "NF Furnace" },
                  { value: "BF", label: "BF Furnace" },

                  // Lab-specific Furnace Zones
                  { value: "LAB_HF_1", label: "Lab HF 1" },

                  // HF Furnaces
                  { value: "HF_2", label: "HF 2" },
                  { value: "HF_3", label: "HF 3" },
                  { value: "HF_4", label: "HF 4" },
                  { value: "HF_5", label: "HF 5" },
                  { value: "HF_6", label: "HF 6" },
                  { value: "HF_7", label: "HF 7" },

                  // BF Furnaces
                  { value: "BF_1", label: "BF 1" },
                  { value: "BF_2", label: "BF 2" },
                  { value: "BF_3", label: "BF 3" },

                  // NF Furnaces
                  { value: "NF_1", label: "NF 1" },
                  { value: "NF_2", label: "NF 2" },
                ]}
                register={register}
                errors={errors}
                watch={watch}
              />
            </div>


            {/* Technical Details */}
            <div className="p-4 rounded-xl bg-gray-50 shadow border grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Measurement Range" name="measurementRange" register={register} errors={errors} watch={watch} />
              <Input label="Accuracy / Resolution" name="accuracy" register={register} errors={errors} watch={watch} />
              <Input label="Calibration Interval (months)" name="calibrationInterval" type="number" register={register} errors={errors} watch={watch} />
              <Input label="Max Usages Number" name="maxUsersNumber" type="number" register={register} errors={errors} watch={watch} />
              <Input label="Purchase Date" name="purchaseDate" type="date" register={register} errors={errors} watch={watch} />
              <Input label="Next Calibration Date" name="nextCalibrationDate" type="date" register={register} errors={errors} watch={watch} />
            </div>

            {/* Notes */}
            <div className="p-4 rounded-xl bg-gray-50 shadow border">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
              <textarea
                {...register("notes")}
                className="w-full border rounded-lg px-3 py-2 text-sm shadow-sm border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey) e.preventDefault();
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View Calibration History →
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Gage"}
              </button>
            </div>
          </div>
        </form>

        {/* Modals */}
        {previewImageUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg p-4 max-w-4xl max-h-[90vh]">
              <button type="button" onClick={() => setPreviewImageUrl(null)} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl z-10">&times;</button>
              <img src={previewImageUrl} alt="Gage Preview" className="max-w-full max-h-[80vh] object-contain rounded" />
            </div>
          </div>
        )}

        {previewVideo && <VideoPlayerModal videoBase64={previewVideo} onClose={() => setPreviewVideo(null)} />}

        {showHistory && (
          <Modal title="Calibration History" onClose={() => setShowHistory(false)}>
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-sm border border-gray-300">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Calibrated By</th>
                    <th className="border p-2 text-left">Certificate #</th>
                    <th className="border p-2 text-left">Remarks</th>
                    <th className="border p-2 text-left">Status</th>
                    <th className="border p-2 text-left">Next Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(gage.calibrationHistory || []).length > 0 ? (
                    gage.calibrationHistory.map((entry, index) => (
                      <tr key={index}>
                        <td className="border p-2">{entry.date || "—"}</td>
                        <td className="border p-2">{entry.calibratedBy || "—"}</td>
                        <td className="border p-2">{entry.certificateNumber || "—"}</td>
                        <td className="border p-2">{entry.remarks || "—"}</td>
                        <td className="border p-2">{entry.status || "—"}</td>
                        <td className="border p-2">{entry.nextCalibrationDueDate || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="text-center text-gray-500 p-4">No calibration history available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default EditGage;