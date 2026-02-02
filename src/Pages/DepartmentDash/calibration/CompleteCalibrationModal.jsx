// src/components/dashboard/modals/CompleteCalibrationModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Upload, 
  FileText, 
  Calendar, 
  User, 
  Hash, 
  ClipboardList,
  Download,
  Eye,
  Trash2,
  Sparkles,
  Gauge,
  Settings
} from 'lucide-react';

const CompleteCalibrationModal = ({ isOpen, onClose, selectedGauge, onSubmit }) => {
  const [formData, setFormData] = useState({
    performedBy: '',
    calibrationDate: new Date().toISOString().split('T')[0],
    result: 'PASSED',
    nextDueDate: '',
    certificateNumber: '',
    notes: '',
    certificate: '',
    fileName: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (selectedGauge) {
        setFormData({
          performedBy: '',
          calibrationDate: new Date().toISOString().split('T')[0],
          result: 'PASSED',
          nextDueDate: calculateNextDueDate(),
          certificateNumber: generateCertificateNumber(),
          notes: '',
          certificate: '',
          fileName: ''
        });
        setErrors({});
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, selectedGauge]);

  const calculateNextDueDate = () => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    return nextYear.toISOString().split('T')[0];
  };

  const generateCertificateNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CERT-${new Date().getFullYear()}-${timestamp}${random}`;
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isVisible) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, certificate: 'Only PDF, JPEG, and PNG files are allowed' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, certificate: 'File size must be less than 5MB' }));
        return;
      }

      simulateUploadProgress();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setUploadProgress(100);
        setTimeout(() => {
          handleChange('certificate', base64String);
          handleChange('fileName', file.name);
          setErrors(prev => ({ ...prev, certificate: null }));
          setUploadProgress(0);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCertificate = () => {
    handleChange('certificate', '');
    handleChange('fileName', '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.performedBy?.trim()) newErrors.performedBy = 'Technician name is required';
    if (!formData.certificateNumber?.trim()) newErrors.certificateNumber = 'Certificate number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = {
        performedBy: formData.performedBy.trim(),
        calibrationDate: formData.calibrationDate,
        result: formData.result,
        nextDueDate: formData.nextDueDate,
        certificateNumber: formData.certificateNumber.trim(),
        notes: formData.notes.trim() || null,
        certificate: formData.certificate || null,
        fileName: formData.fileName || null
      };
      await onSubmit?.(apiData);
      setFormData({
        performedBy: '',
        calibrationDate: new Date().toISOString().split('T')[0],
        result: 'PASSED',
        nextDueDate: calculateNextDueDate(),
        certificateNumber: generateCertificateNumber(),
        notes: '',
        certificate: '',
        fileName: ''
      });
      setErrors({});
      handleClose();
    } catch (error) {
      console.error('Error submitting calibration:', error);
      setErrors({ submit: 'Failed to complete calibration. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'PASSED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CONDITIONAL_PASS': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'OUT_OF_TOLERANCE': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'PASSED': return '✅';
      case 'FAILED': return '❌';
      case 'CONDITIONAL_PASS': return '⚠️';
      case 'OUT_OF_TOLERANCE': return '📏';
      default: return '📋';
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200/80 flex flex-col max-h-[95vh] transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Complete Calibration</h2>
                <p className="text-teal-100 text-sm mt-0.5 flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  Inward gage record • {selectedGauge?.name || 'Unknown Gauge'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 group"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 grow bg-gray-50/50">
          <div className="space-y-6">
            
            {/* Gauge Info Card - Enhanced */}
            <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Settings className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Gauge Information</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                <InfoRow 
                  icon={<Hash className="h-4 w-4" />} 
                  label="Gage ID" 
                  value={selectedGauge?.serialNumber || selectedGauge?.id || 'N/A'} 
                />
                <InfoRow 
                  icon={<ClipboardList className="h-4 w-4" />} 
                  label="Name" 
                  value={selectedGauge?.name || 'N/A'} 
                />
                <InfoRow 
                  icon={<FileText className="h-4 w-4" />} 
                  label="Model" 
                  value={selectedGauge?.model || 'N/A'} 
                />
                <div>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                    <span>Current Status</span>
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getResultColor(selectedGauge?.status || 'PASSED')}`}>
                    <span className="text-xs">{getResultIcon(selectedGauge?.status || 'PASSED')}</span>
                    {selectedGauge?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Submission Error</p>
                  <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Form Grid */}
            <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  icon={<User className="h-4 w-4" />}
                  label="Performed By *"
                  error={errors.performedBy}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.performedBy}
                      onChange={(e) => handleChange('performedBy', e.target.value)}
                      placeholder="Enter technician name"
                      className="w-full px-4 pl-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 bg-white hover:border-gray-400"
                      disabled={isSubmitting}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </FormField>

                <FormField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Calibration Date"
                >
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.calibrationDate}
                      onChange={(e) => handleChange('calibrationDate', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 pl-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 bg-white hover:border-gray-400"
                      disabled={isSubmitting}
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </FormField>

                <FormField label="Result">
                  <div className="relative">
                    <select
                      value={formData.result}
                      onChange={(e) => handleChange('result', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 appearance-none bg-white hover:border-gray-400 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzlDQThBNiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+')] bg-no-repeat bg-right-3 bg-center-3 pr-10"
                      disabled={isSubmitting}
                    >
                      <option value="PASSED">✅ Pass</option>
                      <option value="FAILED">❌ Fail</option>
                      <option value="CONDITIONAL_PASS">⚠️ Conditional Pass</option>
                      <option value="OUT_OF_TOLERANCE">📏 Out of Tolerance</option>
                    </select>
                  </div>
                </FormField>

                <FormField
                  icon={<Hash className="h-4 w-4" />}
                  label="Certificate Number *"
                  error={errors.certificateNumber}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.certificateNumber}
                      onChange={(e) => handleChange('certificateNumber', e.target.value)}
                      placeholder="Auto-generated certificate number"
                      className="w-full px-4 pl-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 bg-white hover:border-gray-400 font-mono"
                      disabled={isSubmitting}
                    />
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </FormField>

                <FormField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Next Due Date"
                >
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.nextDueDate}
                      onChange={(e) => handleChange('nextDueDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 pl-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 bg-white hover:border-gray-400"
                      disabled={isSubmitting}
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </FormField>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200/80 shadow-sm">
              <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-4 w-4 text-teal-600" />
                Upload Certificate (Optional)
              </label>
              
              {!formData.certificate ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="certificate-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="certificate-upload"
                    className="flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-gray-300 rounded-xl transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/50 group cursor-pointer"
                  >
                    <div className="p-3 bg-teal-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">Click to upload certificate</p>
                      <p className="text-xs text-gray-500 mt-1">Supports PDF, JPG, PNG (Max 5MB)</p>
                    </div>
                  </label>
                  
                  {uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-teal-600" />
                    <div>
                      <p className="text-sm font-medium text-teal-900">{formData.fileName}</p>
                      <p className="text-xs text-teal-700">Successfully uploaded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors duration-200"
                      title="Preview certificate"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors duration-200"
                      title="Download certificate"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={removeCertificate}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                      title="Remove certificate"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {errors.certificate && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.certificate}
                </p>
              )}
            </div>

            {/* Notes Section */}
            <FormField label="Additional Notes">
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows="4"
                placeholder="Enter any additional calibration notes, observations, or comments..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all duration-200 bg-white hover:border-gray-400 resize-none"
                disabled={isSubmitting}
              />
            </FormField>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="shrink-0 p-6 pt-4 border-t border-gray-200/80 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 order-2 sm:order-1"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 order-1 sm:order-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing Calibration...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Complete Inward Gage</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            This will mark the gauge as calibrated and update its status in the system
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Reusable Components
const InfoRow = ({ icon, label, value }) => (
  <div className="group">
    <p className="text-xs text-gray-600 flex items-center gap-1.5 mb-2 font-medium">
      <span className="text-gray-500">{icon}</span>
      {label}
    </p>
    <p className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors duration-200">{value}</p>
  </div>
);

const FormField = ({ icon, label, children, error }) => (
  <div className="group">
    <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
      {icon}
      {label}
    </label>
    {children}
    {error && (
      <p className="text-red-600 text-xs mt-2 flex items-center gap-1.5 animate-pulse">
        <AlertTriangle className="h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
);

export default CompleteCalibrationModal;