import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  FileText,
  CalendarPlus,
  Send,
  X,
  Mail,
  Plus,
  Trash2,
  Gauge,
  Camera,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';

// Simple Camera Modal Component
const SimpleCameraModal = ({ isOpen, onClose, onCapture, label }) => {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch (e) { /* ignore */ }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setCapturedImage({ blob, url });
      }, 'image/jpeg', 0.9);
    }
  };

  const savePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage.blob, capturedImage.url);
      setCapturedImage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl">
        <div className="bg-gray-800 p-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {label}
          </h3>
          <button onClick={onClose} className="text-white hover:bg-gray-700 p-2 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '60vh' }}
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={capturePhoto}
                className="w-full mt-4 py-3 bg-white rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <Camera className="h-5 w-5" />
                Capture Photo
              </button>
            </>
          ) : (
            <>
              <img src={capturedImage.url} alt="Preview" className="w-full rounded-lg" />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="flex-1 py-3 border-2 border-gray-600 text-white rounded-lg hover:bg-gray-800"
                >
                  Retake
                </button>
                <button
                  onClick={savePhoto}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  Use Photo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ScheduleCalibrationModal = ({ isOpen, onClose, selectedGage, onSubmit }) => {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '09:00',
    priority: 'medium',
    assignedTo: '',
    laboratory: '',
    estimatedDuration: 2,
    notes: '',
    requiresSpecialEquipment: false,
    specialEquipment: '',
    emailEnabled: true,
    emailTo: '',
    emailCC: []
  });

  // Mandatory photos
  const [photos, setPhotos] = useState({
    serialNumber: null,
    frontView: null,
    backView: null
  });

  const [errors, setErrors] = useState({});
  const [newCC, setNewCC] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraModal, setCameraModal] = useState({ isOpen: false, type: null, label: '' });

  useEffect(() => {
    if (isOpen && selectedGage) {
      const defaultEmailTo = selectedGage.responsible
        ? `${selectedGage.responsible.toLowerCase().replace(/\s+/g, '.')}@company.com`
        : '';

      setFormData(prev => ({
        ...prev,
        priority: selectedGage.priority || 'medium',
        emailTo: defaultEmailTo,
        scheduledDate: '',
        scheduledTime: '09:00',
        assignedTo: '',
        laboratory: '',
        estimatedDuration: 2,
        notes: '',
        requiresSpecialEquipment: false,
        specialEquipment: '',
        emailCC: []
      }));
      setPhotos({ serialNumber: null, frontView: null, backView: null });
      setErrors({});
    }
  }, [isOpen, selectedGage]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleAddCC = () => {
    if (newCC && newCC.includes('@') && !formData.emailCC.includes(newCC)) {
      setFormData(prev => ({ ...prev, emailCC: [...prev.emailCC, newCC] }));
      setNewCC('');
    }
  };

  const handleRemoveCC = (index) => {
    setFormData(prev => ({
      ...prev,
      emailCC: prev.emailCC.filter((_, i) => i !== index)
    }));
  };

  const openCamera = (type, label) => {
    setCameraModal({ isOpen: true, type, label });
  };

  const handlePhotoCapture = async (blob, url) => {
    // Convert blob to base64
    const base64 = await blobToBase64(blob);
    setPhotos(prev => ({
      ...prev,
      [cameraModal.type]: { blob, url, base64 }
    }));
    if (errors[cameraModal.type]) {
      setErrors(prev => ({ ...prev, [cameraModal.type]: null }));
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extract base64 data after the comma
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const removePhoto = (type) => {
    setPhotos(prev => ({ ...prev, [type]: null }));
  };

  const generateEmailContent = () => {
    return `CALIBRATION ASSIGNMENT

Dear ${formData.assignedTo || 'Technician'},

You have been assigned a calibration task for the following instrument:

INSTRUMENT DETAILS:
• Instrument ID: ${selectedGage?.serialNumber || selectedGage?.id || 'N/A'}
• Model: ${selectedGage?.model || 'N/A'}
• Name: ${selectedGage?.name || 'N/A'}
• Manufacturer: ${selectedGage?.manufacturer || 'N/A'}
• Location: ${selectedGage?.location || 'N/A'}

SCHEDULE:
• Date: ${formData.scheduledDate ? new Date(formData.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
• Time: ${formData.scheduledTime || '09:00'}
• Duration: ${formData.estimatedDuration || 2} hours
• Laboratory: ${formData.laboratory || 'TBD'}
• Priority: ${formData.priority?.toUpperCase() || 'MEDIUM'}

${formData.requiresSpecialEquipment ? `SPECIAL EQUIPMENT REQUIRED:
${formData.specialEquipment || 'Special calibration equipment'}

` : ''}${formData.notes ? `ADDITIONAL NOTES:
${formData.notes}

` : ''}Please confirm your availability and complete the calibration as scheduled.

Best regards,
Quality Assurance Department`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate form
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Date is required';
    if (!formData.assignedTo?.trim()) newErrors.assignedTo = 'Technician is required';
    if (!formData.laboratory) newErrors.laboratory = 'Laboratory is required';

    // Validate mandatory photos
    if (!photos.serialNumber) newErrors.serialNumber = 'Serial number photo is required';
    if (!photos.frontView) newErrors.frontView = 'Front view photo is required';
    if (!photos.backView) newErrors.backView = 'Back view photo is required';

    if (formData.emailEnabled && (!formData.emailTo || !formData.emailTo.includes('@'))) {
      newErrors.emailTo = 'Valid email is required';
    }

    // Validate selected gage
    // if (!selectedGage?.id) {
    //   newErrors.submit = 'Invalid gage selected. Cannot schedule calibration.';
    // }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        gageId: selectedGage?.id || 1, // Use 1 if id is null or empty
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        priority: formData.priority,
        assignedTo: formData.assignedTo.trim(),
        laboratory: formData.laboratory,
        estimatedDuration: parseInt(formData.estimatedDuration) || 2,
        notes: formData.notes.trim() || null,
        requiresSpecialEquipment: formData.requiresSpecialEquipment,
        specialEquipment: formData.specialEquipment.trim() || null,
        emailEnabled: formData.emailEnabled,
        emailTo: formData.emailTo,
        emailCC: formData.emailCC,
        emailSubject: `Calibration Assignment: ${selectedGage?.name || selectedGage?.serialNumber}`,
        emailMessage: generateEmailContent(),
        // Send photos as base64 strings with content type
        serialNumberPhoto: photos.serialNumber?.base64 || '',
        serialNumberPhotoContentType: 'image/jpeg',
        frontViewPhoto: photos.frontView?.base64 || '',
        frontViewPhotoContentType: 'image/jpeg',
        backViewPhoto: photos.backView?.base64 || '',
        backViewPhotoContentType: 'image/jpeg'
      };
      const userEmail = localStorage.getItem("email");
      const res = await fetch(`http://localhost:8080/api/calibration-manager/gages/${selectedGage?.id || 1}/schedule`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "User-ID": "1",     // add this
          "User-Email": localStorage.getItem("email") || "test@swajyot.co.in" // add this
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to schedule calibration');
      }

      // Create calendar event
      const startDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (formData.estimatedDuration * 60 * 60 * 1000));

      await fetch('http://localhost:8080/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Calibration: ${selectedGage?.name || selectedGage?.serialNumber}`,
          description: `${formData.laboratory}\nTechnician: ${formData.assignedTo}`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          category: "inward",
          priority: formData.priority,
          location: formData.laboratory,
          attendees: [formData.emailTo],
          reminders: [{ type: "popup", minutes: 15 }],
          color: "#3b82f6",
          username: localStorage.getItem("email")
        })
      });

      const data = await res.json();
      await onSubmit?.(data);
      onClose?.();

    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: error.message || 'Failed to schedule calibration' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const photoButtons = [
    { key: 'serialNumber', label: 'Serial Number Photo', icon: '🏷️' },
    { key: 'frontView', label: 'Front View Photo', icon: '📷' },
    { key: 'backView', label: 'Back View Photo', icon: '📸' }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CalendarPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Schedule Calibration</h2>
                  <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    {selectedGage?.name || selectedGage?.serialNumber || 'Instrument'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            {/* Mandatory Photos Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                Required Photos (3 Mandatory)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {photoButtons.map(({ key, label, icon }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {icon} {label} *
                    </label>
                    {!photos[key] ? (
                      <button
                        type="button"
                        onClick={() => openCamera(key, label)}
                        className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${errors[key]
                          ? 'border-red-500 bg-red-50 hover:bg-red-100'
                          : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                          }`}
                      >
                        <Camera className={`h-8 w-8 ${errors[key] ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${errors[key] ? 'text-red-600' : 'text-gray-600'}`}>
                          Take Photo
                        </span>
                      </button>
                    ) : (
                      <div className="relative group">
                        <img
                          src={photos[key].url}
                          alt={label}
                          className="w-full h-32 object-cover rounded-xl border-2 border-green-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCamera(key, label)}
                            className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                          >
                            <Camera className="h-5 w-5 text-white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePhoto(key)}
                            className="p-2 bg-red-600 rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="h-5 w-5 text-white" />
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    {errors[key] && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {errors[key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleChange('scheduledDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    disabled={isSubmitting}
                  />
                  {errors.scheduledDate && (
                    <p className="text-red-600 text-xs mt-1">{errors.scheduledDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => handleChange('scheduledTime', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Priority and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  >
                    <option value="low">🟢 Low Priority</option>
                    <option value="medium">🟡 Medium Priority</option>
                    <option value="high">🔴 High Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleChange('estimatedDuration', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Technician and Laboratory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    Assigned Technician *
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                    placeholder="Enter technician name"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 ${errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    disabled={isSubmitting}
                  />
                  {errors.assignedTo && (
                    <p className="text-red-600 text-xs mt-1">{errors.assignedTo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                     Service Provider*
                  </label>
                  <select
                    value={formData.laboratory}
                    onChange={(e) => handleChange('laboratory', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 ${errors.laboratory ? 'border-red-500' : 'border-gray-300'
                      }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Service Provider</option>
                    <option value="Authorized Service Provider">Authorized Service Provider</option>
                    <option value="Unauthorized Service Provider">Unauthorized Service Provider</option>
                    <option value="Mechanical Testing Lab">Mechanical Testing Lab</option>
                    <option value="Electronics Lab">Electronics Lab</option>
                  </select>
                  {errors.laboratory && (
                    <p className="text-red-600 text-xs mt-1">{errors.laboratory}</p>
                  )}
                </div>
              </div>

              {/* Special Equipment */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresSpecialEquipment}
                    onChange={(e) => handleChange('requiresSpecialEquipment', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-semibold text-gray-700">Requires Special Equipment</span>
                </label>
                {formData.requiresSpecialEquipment && (
                  <input
                    type="text"
                    value={formData.specialEquipment}
                    onChange={(e) => handleChange('specialEquipment', e.target.value)}
                    placeholder="List required equipment"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  />
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows="3"
                  placeholder="Add any special instructions..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Email Notification */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.emailEnabled}
                    onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isSubmitting}
                  />
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Send Email Notification</span>
                </label>

                {formData.emailEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        To: *
                      </label>
                      <input
                        type="email"
                        value={formData.emailTo}
                        onChange={(e) => handleChange('emailTo', e.target.value)}
                        placeholder="recipient@company.com"
                        className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.emailTo ? 'border-red-500' : 'border-gray-300'
                          }`}
                        disabled={isSubmitting}
                      />
                      {errors.emailTo && (
                        <p className="text-red-600 text-xs mt-1">{errors.emailTo}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CC: (optional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="email"
                          value={newCC}
                          onChange={(e) => setNewCC(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCC())}
                          placeholder="Add CC recipient"
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={handleAddCC}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          disabled={isSubmitting}
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      {formData.emailCC.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.emailCC.map((email, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {email}
                              <button
                                type="button"
                                onClick={() => handleRemoveCC(index)}
                                className="hover:text-blue-900"
                                disabled={isSubmitting}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {formData.emailEnabled ? 'Schedule & Send Email' : 'Schedule Calibration'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Modal */}
      <SimpleCameraModal
        isOpen={cameraModal.isOpen}
        onClose={() => setCameraModal({ isOpen: false, type: null, label: '' })}
        onCapture={handlePhotoCapture}
        label={cameraModal.label}
      />
    </>
  );
};

export default ScheduleCalibrationModal;