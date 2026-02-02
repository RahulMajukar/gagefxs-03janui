// src/components/dashboard/InwardModal.jsx
import { useState } from 'react';
import {
  X,
  Upload,
  Camera,
  Video,
  FileText,
  Image,
  Trash2, VolumeX, Smartphone
} from 'lucide-react';
import CameraModal from './CameraModal';

// Main InwardModal Component
const InwardModal = ({ isOpen, onClose, selectedGage, onSubmit, isLoading = false }) => {
  // const [isLoading, setIsLoading] = useState(false);
  // const [showInwardModal, setShowInwardModal] = useState(true); // removed unused local state
  const [formData, setFormData] = useState({
    calibrationDate: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    performedBy: '',
    status: 'PASSED',
    notes: ''
  });

  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  // Camera modal states
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'video'

  if (!isOpen) return null;

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // File upload handlers
  const handleFileUpload = (e, fileType) => {
    const files = Array.from(e.target.files);

    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file)
    }));

    switch (fileType) {
      case 'documents':
        setDocuments(prev => [...prev, ...newFiles]);
        break;
      case 'images':
        setImages(prev => [...prev, ...newFiles]);
        break;
      case 'videos':
        setVideos(prev => [...prev, ...newFiles]);
        break;
      default:
        break;
    }

    e.target.value = ''; // reset file input so same file can be uploaded again if needed
  };

  // Remove file handler
  const removeFile = (id, fileType) => {
    switch (fileType) {
      case 'documents':
        setDocuments(prev => prev.filter(file => file.id !== id));
        break;
      case 'images':
        setImages(prev => prev.filter(file => file.id !== id));
        break;
      case 'videos':
        setVideos(prev => prev.filter(file => file.id !== id));
        break;
      default:
        break;
    }
  };

  // Handle camera capture
  const handleCameraCapture = (file, url, type) => {
    const newFile = {
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: type === 'image' ? `photo_${Date.now()}.jpg` : `video_${Date.now()}.webm`,
      size: file.size,
      type: file.type,
      url
    };

    if (type === 'image') {
      setImages(prev => [...prev, newFile]);
    } else {
      setVideos(prev => [...prev, newFile]);
    }
  };

  // Open camera modal
  const openCameraModal = (mode) => {
    setCameraMode(mode);
    setCameraModalOpen(true);
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));

    documents.forEach(doc => submissionData.append('documents', doc.file));
    images.forEach(img => submissionData.append('images', img.file));
    videos.forEach(vid => submissionData.append('videos', vid.file));

    const fileSummary = {
      documents: documents.map(d => ({ name: d.name, size: d.size })),
      images: images.map(i => ({ name: i.name, size: i.size })),
      videos: videos.map(v => ({ name: v.name, size: v.size })),
    };

    // call the prop passed from parent
    onSubmit?.(submissionData, fileSummary);
  };


  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  // Cleanup on close
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Main Modal with z-index 50 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Process Inward</h2>
                <p className="text-purple-100 mt-1">
                  {selectedGage?.name} • {selectedGage?.serialNumber}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calibration Date *
                  </label>
                  <input
                    type="date"
                    name="calibrationDate"
                    value={formData.calibrationDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    name="nextDueDate"
                    value={formData.nextDueDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performed By *
                  </label>
                  <input
                    type="text"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleInputChange}
                    placeholder="Enter technician name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="CONDITIONAL_PASS">CONDITIONAL PASS</option>
                    <option value="OUT_OF_TOLERANCE">OUT OF TOLERANCE</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any notes about the calibration..."
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Documents Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documents
                </h3>

                <div className="space-y-4">
                  <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mr-3" />
                    <span className="text-gray-600">Upload PDFs, DOCs, or other documents</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={(e) => handleFileUpload(e, 'documents')}
                      className="hidden"
                    />
                  </label>

                  {documents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(doc.id, 'documents')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Images Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5 text-green-600" />
                  Images
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* File Upload */}
                    <label className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mr-3" />
                      <span className="text-gray-600 text-sm text-center">Upload Images</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'images')}
                        className="hidden"
                      />
                    </label>

                    {/* Camera Options */}
                    <button
                      type="button"
                      onClick={() => openCameraModal('photo')}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-gray-600 text-sm text-center">Take Photos with Camera</span>
                    </button>

                    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <Smartphone className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-gray-600 text-sm text-center">Use front/back camera with editing options</span>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(img.id, 'images')}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Videos Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-600" />
                  Videos
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* File Upload */}
                    <label className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mr-3" />
                      <span className="text-gray-600 text-sm text-center">Upload Videos</span>
                      <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'videos')}
                        className="hidden"
                      />
                    </label>

                    {/* Video Recording */}
                    <button
                      type="button"
                      onClick={() => openCameraModal('video')}
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition-colors"
                    >
                      <Video className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-gray-600 text-sm text-center">Record Video with Camera</span>
                    </button>

                    <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <VolumeX className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-gray-600 text-sm text-center">Mute/unmute audio, switch cameras</span>
                    </div>
                  </div>

                  {videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((vid) => (
                        <div key={vid.id} className="relative group">
                          <video
                            src={vid.url}
                            className="w-full h-32 object-cover rounded-lg"
                            controls
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(vid.id, 'videos')}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {vid.name} • {formatFileSize(vid.size)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                    <div className="text-gray-600">Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{images.length}</div>
                    <div className="text-gray-600">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{videos.length}</div>
                    <div className="text-gray-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {documents.length + images.length + videos.length}
                    </div>
                    <div className="text-gray-600">Total Files</div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.performedBy}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Process Inward
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Camera Modal with higher z-index */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        mode={cameraMode}
      />
    </>
  );
};

export default InwardModal;